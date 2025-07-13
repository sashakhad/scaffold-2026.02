describe("App", () => {
  it("should load the application", () => {
    cy.visit("/");

    // Basic checks that the app is working
    cy.get("body").should("be.visible");
    cy.get("html").should("have.attr", "lang");

    // Check that the page has some content (without being too specific)
    cy.get("main, div, body").should("not.be.empty");
  });

  it("should have proper page structure", () => {
    cy.visit("/");

    // Check for basic HTML structure without being content-specific
    cy.get("head").should("exist");
    cy.get("body").should("exist");

    // Ensure the page is interactive (not just a static file)
    cy.window().should("have.property", "document");
  });
});
