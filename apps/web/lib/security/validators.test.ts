/* @vitest-environment node */
import { describe, expect, it } from "vitest";
import {
  isValidMunicipalityId,
  isValidServiceId,
  isValidVariableName,
} from "./validators";

describe("validators", () => {
  it("accepts valid municipality ids", () => {
    expect(isValidMunicipalityId("takaoka")).toBe(true);
    expect(isValidMunicipalityId("takaoka-shi")).toBe(true);
    expect(isValidMunicipalityId("city-123")).toBe(true);
  });

  it("rejects unsafe municipality ids", () => {
    expect(isValidMunicipalityId("../secret")).toBe(false);
    expect(isValidMunicipalityId("a/b")).toBe(false);
    expect(isValidMunicipalityId("a\\b")).toBe(false);
    expect(isValidMunicipalityId("UPPER")).toBe(false);
  });

  it("accepts valid service ids", () => {
    expect(isValidServiceId("childcare")).toBe(true);
    expect(isValidServiceId("driving-license")).toBe(true);
  });

  it("rejects unsafe service ids", () => {
    expect(isValidServiceId("../driving")).toBe(false);
    expect(isValidServiceId("drive/ing")).toBe(false);
  });

  it("accepts valid variable names", () => {
    expect(isValidVariableName("city_hall_phone")).toBe(true);
    expect(isValidVariableName("gomi_shushu")).toBe(true);
  });

  it("rejects unsafe variable names", () => {
    expect(isValidVariableName("../etc")).toBe(false);
    expect(isValidVariableName("a/b")).toBe(false);
    expect(isValidVariableName("a-b")).toBe(false);
  });
});
