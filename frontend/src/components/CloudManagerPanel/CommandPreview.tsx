interface CommandPreviewProps {
  program: string
  environment: string
  tier: string
  mode?: 'download' | 'tail'
}

export function CommandPreview({ program, environment, tier, mode = 'download' }: CommandPreviewProps) {
  if (!program || !environment) return null

  const cmd = mode === 'download'
    ? `aio aem:rde:download -p ${program} -e ${environment} -t ${tier}`
    : `aio aem:rde:tail -p ${program} -e ${environment} -t ${tier}`

  return (
    <div className="cloudmanager-command-preview" data-testid="command-preview">
      <code>{cmd}</code>
    </div>
  )
}
