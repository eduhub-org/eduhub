import { canAccessPath } from "./access.js";

const OWNER = "11111111-1111-1111-1111-111111111111";
const OTHER = "22222222-2222-2222-2222-222222222222";

describe("canAccessPath", () => {
  it("keeps instructor access to ordinary files", () => {
    expect(canAccessPath(`${OTHER}/5/attendance_certificate.pdf`, "instructor", OWNER)).toBe(true);
  });

  it("lets only the owner load an instructor invoice", () => {
    const invoice = `${OWNER}/5/instructor_invoice.pdf`;
    expect(canAccessPath(invoice, "instructor", OWNER)).toBe(true);
    expect(canAccessPath(invoice, "user", OWNER)).toBe(true);
    expect(canAccessPath(invoice, "instructor", OTHER)).toBe(false);
    expect(canAccessPath(invoice, "instructor", undefined)).toBe(false);
  });

  it("lets admins load any invoice", () => {
    expect(canAccessPath(`${OWNER}/5/instructor_invoice.pdf`, "admin", OTHER)).toBe(true);
  });

  it("keeps users limited to their own files", () => {
    expect(canAccessPath(`${OWNER}/5/attendance_certificate.pdf`, "user", OWNER)).toBe(true);
    expect(canAccessPath(`${OWNER}/5/attendance_certificate.pdf`, "user", OTHER)).toBe(false);
  });
});
