const express = require('express');
const path = require('path');
const { execSync } = require('child_process');
const { loadExistingCredentials, saveCredentials, maskCredential } = require('../../scripts/lib/credential-loader');
const { validateAllCredentials } = require('../utils/credential-validator');
const { sanitizeErrorMessage } = require('../utils/files');

const CONFIG_PATH = path.join(process.env.HOME || process.env.USERPROFILE, '.aio', 'config.json');

function createOnboardingRouter() {
  const router = express.Router();

  router.post('/onboarding/status', async (_req, res) => {
    try {
      const existingCreds = loadExistingCredentials(CONFIG_PATH);
      const credentialsExist = existingCreds !== null;
      const credentialsValid = credentialsExist && !existingCreds.invalid;

      let defaultOrg = null;
      let defaultProgram = null;

      if (existingCreds && existingCreds.ims_org_id) {
        try {
          const orgs = execSync('aio cloudmanager:org:list --json', { encoding: 'utf8' });
          const orgList = JSON.parse(orgs);
          const matchingOrg = orgList.find(org => org.imsOrgId === existingCreds.ims_org_id);
          if (matchingOrg) {
            defaultOrg = {
              id: matchingOrg.id,
              name: matchingOrg.name,
              imsOrgId: matchingOrg.imsOrgId
            };
          }
        } catch (e) {
          // Ignore errors listing orgs
        }
      }

      if (defaultOrg) {
        try {
          const programs = execSync(`aio cloudmanager:list-programs --programId=${defaultOrg.id} --json`, { encoding: 'utf8' });
          const programList = JSON.parse(programs);
          if (programList.length > 0) {
            defaultProgram = {
              id: programList[0].id,
              name: programList[0].name,
              productionEnvironment: programList[0].productionEnvironment
            };
          }
        } catch (e) {
          // Ignore errors listing programs
        }
      }

      const wizardStatus = credentialsValid ? 'completed' : credentialsExist ? 'incomplete' : 'not_started';

      res.json({
        success: true,
        wizardStatus,
        credentialsExist,
        credentialsValid,
        maskedCredentials: existingCreds ? {
          clientId: existingCreds.client_id,
          technicalAccountEmail: existingCreds.technical_account_email,
          imsOrgId: existingCreds.ims_org_id
        } : null,
        defaultOrg,
        defaultProgram,
        prerequisites: {
          aioCliInstalled: true,
          cloudManagerPluginInstalled: true
        }
      });
    } catch (error) {
      res.json({ success: false, error: sanitizeErrorMessage(error.message) });
    }
  });

  router.post('/onboarding/save-credentials', async (req, res) => {
    try {
      const {
        clientId,
        clientSecret,
        technicalAccountId,
        technicalAccountEmail,
        imsOrgId,
        scopes
      } = req.body || {};

      const credsForValidation = {
        clientId,
        clientSecret,
        technicalAccountId,
        email: technicalAccountEmail,
        orgId: imsOrgId,
        scopes: scopes || []
      };

      const validation = validateAllCredentials(credsForValidation);

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors: validation.errors
        });
      }

      const credentialsToSave = {
        client_id: clientId,
        client_secrets: [clientSecret],
        technical_account_id: technicalAccountId,
        technical_account_email: technicalAccountEmail,
        ims_org_id: imsOrgId,
        scopes: scopes || []
      };

      const saved = saveCredentials(credentialsToSave, CONFIG_PATH);

      if (!saved) {
        return res.status(500).json({
          success: false,
          error: 'Failed to save credentials. Please check file permissions.'
        });
      }

      res.json({
        success: true,
        message: 'Credentials saved successfully',
        maskedClientId: maskCredential(clientId)
      });
    } catch (error) {
      res.json({ success: false, error: sanitizeErrorMessage(error.message) });
    }
  });

  router.post('/onboarding/list-organizations', async (_req, res) => {
    try {
      const orgsJson = execSync('aio cloudmanager:org:list --json', { encoding: 'utf8' });
      const orgs = JSON.parse(orgsJson);

      const formattedOrgs = orgs.map(org => ({
        id: org.id,
        name: org.name,
        imsOrgId: org.imsOrgId
      }));

      res.json({
        success: true,
        organizations: formattedOrgs
      });
    } catch (error) {
      res.json({
        success: false,
        error: 'Failed to list organizations. Make sure you are authenticated with `aio auth login`.',
        hint: 'Run "aio auth login" in your terminal to authenticate'
      });
    }
  });

  router.post('/onboarding/list-programs', async (req, res) => {
    try {
      const { organizationId } = req.body || {};

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID is required'
        });
      }

      const programsJson = execSync(
        `aio cloudmanager:list-programs --programId=${organizationId} --json`,
        { encoding: 'utf8' }
      );
      const programs = JSON.parse(programsJson);

      const formattedPrograms = programs.map(prog => ({
        id: prog.id,
        name: prog.name,
        productionEnvironment: prog.productionEnvironment
      }));

      res.json({
        success: true,
        programs: formattedPrograms
      });
    } catch (error) {
      res.json({
        success: false,
        error: sanitizeErrorMessage(error.message),
        hint: 'Make sure the Organization ID is correct'
      });
    }
  });

  router.post('/onboarding/verify-connection', async (req, res) => {
    try {
      const { organizationId, programId } = req.body || {};

      if (!organizationId || !programId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID and Program ID are required'
        });
      }

      let orgDetails = null;
      try {
        const orgsJson = execSync('aio cloudmanager:org:list --json', { encoding: 'utf8' });
        const orgs = JSON.parse(orgsJson);
        orgDetails = orgs.find(org => org.id === organizationId || org.imsOrgId === organizationId);
      } catch (e) {
        // Ignore
      }

      let programDetails = null;
      try {
        const programsJson = execSync(
          `aio cloudmanager:list-programs --programId=${organizationId} --json`,
          { encoding: 'utf8' }
        );
        const programs = JSON.parse(programsJson);
        programDetails = programs.find(p => p.id === programId);
      } catch (e) {
        // Ignore
      }

      if (!orgDetails) {
        return res.status(400).json({
          success: false,
          error: 'Organization not found. Please check your credentials.'
        });
      }

      if (!programDetails) {
        return res.status(400).json({
          success: false,
          error: 'Program not found. Please check your credentials and organization access.'
        });
      }

      res.json({
        success: true,
        organization: {
          id: orgDetails.id,
          name: orgDetails.name,
          imsOrgId: orgDetails.imsOrgId
        },
        program: {
          id: programDetails.id,
          name: programDetails.name,
          productionEnvironment: programDetails.productionEnvironment
        },
        message: 'Connection verified successfully'
      });
    } catch (error) {
      res.json({
        success: false,
        error: sanitizeErrorMessage(error.message),
        hint: 'Verify your credentials are valid by running "aio auth list"'
      });
    }
  });

  router.post('/onboarding/complete', async (req, res) => {
    try {
      const { organizationId, programId, setAsDefault } = req.body || {};

      if (!organizationId || !programId) {
        return res.status(400).json({
          success: false,
          error: 'Organization ID and Program ID are required'
        });
      }

      if (setAsDefault) {
        const fs = require('fs');
        const os = require('os');
        const configDir = path.join(os.homedir(), '.logs-inspector');
        const defaultConfigPath = path.join(configDir, 'default-config.json');

        try {
          if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
          }

          const defaultConfig = {
            organizationId,
            programId,
            updatedAt: new Date().toISOString()
          };

          fs.writeFileSync(defaultConfigPath, JSON.stringify(defaultConfig, null, 2));
        } catch (e) {
          return res.status(500).json({
            success: false,
            error: 'Failed to save default configuration'
          });
        }
      }

      res.json({
        success: true,
        message: 'Onboarding completed successfully',
        organizationId,
        programId,
        setAsDefault
      });
    } catch (error) {
      res.json({ success: false, error: sanitizeErrorMessage(error.message) });
    }
  });

  return router;
}

module.exports = createOnboardingRouter;
