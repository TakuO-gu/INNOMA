/* @vitest-environment node */
import { describe, expect, it } from "vitest";
import { validateEmail } from "./validators";

describe("validateEmail", () => {
  it("accepts email address", () => {
    const result = validateEmail("somu@city.takaoka.lg.jp");
    expect(result.valid).toBe(true);
  });

  it("accepts contact form URL", () => {
    const result = validateEmail("https://www.city.takaoka.toyama.jp/cgi-bin/inquiry.php/8?page_no=2920");
    expect(result.valid).toBe(true);
  });
});
