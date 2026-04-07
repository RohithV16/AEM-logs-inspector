const { parseArgs, parseFlags } = require('../../src/index');

describe('CLI argument parsing', () => {
  test('parses cloudmanager analyze mode', () => {
    expect(parseArgs(['cloudmanager', 'analyze', '--programId', 'p1'])).toEqual({
      mode: 'cloudmanager',
      action: 'analyze',
      flags: { programId: 'p1' }
    });
  });

  test('parses cloudmanager tail mode', () => {
    expect(parseArgs(['cloudmanager', 'tail', '--environmentId', 'e1', '--service', 'author', '--logName', 'aemerror'])).toEqual({
      mode: 'cloudmanager',
      action: 'tail',
      flags: {
        environmentId: 'e1',
        service: 'author',
        logName: 'aemerror'
      }
    });
  });

  test('parses local analyze mode', () => {
    expect(parseArgs(['analyze', '/tmp/error.log'])).toEqual({
      mode: 'local',
      filePath: '/tmp/error.log'
    });
  });

  test('parses flags with booleans', () => {
    expect(parseFlags(['--foo', 'bar', '--verbose'])).toEqual({
      foo: 'bar',
      verbose: true
    });
  });
});
