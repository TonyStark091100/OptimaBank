import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

// ✅ Mock global alert and confirm
global.alert = jest.fn();
global.confirm = jest.fn(() => true);

describe("App Routing & Pages", () => {
  test("renders WelcomePage by default", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    const welcomeText = screen.getByText(/Welcome Back!/i);
    expect(welcomeText).toBeInTheDocument();
  });

  test("navigates to SignUpPage from WelcomePage", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    const getStartedBtn = screen.getByText(/Get Started/i);
    fireEvent.click(getStartedBtn);

    const signupHeader = screen.getByText(/Sign Up/i);
    expect(signupHeader).toBeInTheDocument();
  });

  test("navigates to LoginPage from WelcomePage", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    const loginBtn = screen.getByText(/Login/i);
    fireEvent.click(loginBtn);

    const loginHeader = screen.getByText(/Welcome Back!/i);
    expect(loginHeader).toBeInTheDocument();
  });

  test("signs up successfully", () => {
    render(
      <MemoryRouter initialEntries={["/signup"]}>
        <App />
      </MemoryRouter>
    );

    const signUpBtn = screen.getByRole("button", { name: /Sign Up/i });
    fireEvent.click(signUpBtn);

    expect(global.alert).toHaveBeenCalledWith("Signed up successfully!");
  });

  test("logs in successfully", () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <App />
      </MemoryRouter>
    );

    const loginBtn = screen.getByRole("button", { name: /Login/i });
    fireEvent.click(loginBtn);

    expect(global.alert).toHaveBeenCalledWith("Logged in successfully!");
  });
});
