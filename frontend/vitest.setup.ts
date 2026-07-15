import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"
import "@testing-library/jest-dom/vitest"

// Explicit since `test.globals` is off (tests import describe/it/expect
// themselves) -- RTL's auto-cleanup relies on detecting a global afterEach.
afterEach(() => {
  cleanup()
})
