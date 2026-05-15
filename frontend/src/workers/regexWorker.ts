self.onmessage = function (e: MessageEvent<{ pattern: string }>) {
  const { pattern } = e.data
  try {
    new RegExp(pattern).test('quick-check-input')
    self.postMessage({ ok: true })
  } catch (err) {
    self.postMessage({ ok: false, error: (err as Error).message })
  }
}
