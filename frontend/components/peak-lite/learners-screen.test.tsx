import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import type { ApiLearner } from "@/lib/peak-lite-api"
import { LearnersScreen } from "./learners-screen"

const fixtureLearners: ApiLearner[] = [
  { id: 1, full_name: "Alex Chen", grade_level: "6-8", learning_needs: ["dyslexia"], availability: ["mornings"], family_user: null },
  { id: 2, full_name: "Mateo Rivera", grade_level: "3-5", learning_needs: ["focus"], availability: ["afternoons"], family_user: null },
  { id: 3, full_name: "Priya Anand", grade_level: "K-2", learning_needs: ["number_sense"], availability: ["mornings"], family_user: null },
]

function renderScreen() {
  return render(
    <LearnersScreen
      learners={fixtureLearners}
      plans={[]}
      matchStatusFor={() => ({ matched: false, instructorName: null })}
      actionFor={() => ({ label: "Run Match", onClick: vi.fn() })}
    />,
  )
}

describe("LearnersScreen", () => {
  it("shows every learner and the correct count with no filters applied", () => {
    renderScreen()

    expect(screen.getByText("Showing 3 of 3 learners")).toBeInTheDocument()
    expect(screen.getByText("Alex Chen")).toBeInTheDocument()
    expect(screen.getByText("Mateo Rivera")).toBeInTheDocument()
    expect(screen.getByText("Priya Anand")).toBeInTheDocument()
  })

  it("narrows the grid and the count when searching by name", async () => {
    const user = userEvent.setup()
    renderScreen()

    await user.type(screen.getByLabelText(/search by name/i), "Alex")

    expect(screen.getByText("Showing 1 of 3 learners")).toBeInTheDocument()
    expect(screen.getByText("Alex Chen")).toBeInTheDocument()
    expect(screen.queryByText("Mateo Rivera")).not.toBeInTheDocument()
    expect(screen.queryByText("Priya Anand")).not.toBeInTheDocument()
  })

  it("shows an empty state and a Clear filters button when nothing matches", async () => {
    const user = userEvent.setup()
    renderScreen()

    await user.type(screen.getByLabelText(/search by name/i), "Nobody Here")

    expect(screen.getByText(/no learners match these filters/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /clear filters/i })).toBeInTheDocument()
  })
})
