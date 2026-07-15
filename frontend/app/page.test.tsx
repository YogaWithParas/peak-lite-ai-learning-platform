import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it } from "vitest"
import HomePage from "./page"

describe("login screen", () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it("shows the login form with no session", async () => {
    render(<HomePage />)

    expect(await screen.findByRole("button", { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/username/i)).toHaveValue("")
    expect(screen.getByLabelText(/password/i)).toHaveValue("")
  })

  it("fills in the real seeded credentials when a role preview button is clicked, without signing in", async () => {
    const user = userEvent.setup()
    render(<HomePage />)

    await screen.findByRole("button", { name: /sign in/i })
    await user.click(screen.getByRole("button", { name: "Case Manager" }))

    expect(screen.getByLabelText(/username/i)).toHaveValue("casemanager_demo")
    expect(screen.getByLabelText(/password/i)).toHaveValue("peaklite-demo-2026")
    // Filling the fields must not sign anyone in on its own -- the demo
    // buttons are a convenience, not a bypass of real authentication.
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument()
  })

  it("fills in a different account for each role button", async () => {
    const user = userEvent.setup()
    render(<HomePage />)

    await screen.findByRole("button", { name: /sign in/i })
    await user.click(screen.getByRole("button", { name: "Family" }))

    expect(screen.getByLabelText(/username/i)).toHaveValue("family_chen")
  })
})
