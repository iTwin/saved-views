/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-useless-escape */
import { isBase64 } from "class-validator";
import { CombinedId } from "../models/combinedId";
import { describe, expect, it } from "vitest";


describe("CombinedId (unit) tests", () => {
  describe("New", () => {
    it("return empty fields if invalid combinedId", () => {
      // Arrange
      const invalidCombinedId = "2560be6f-ef84-475d-85c0-c4833ab74bb5";

      // Act
      const tested = new CombinedId(invalidCombinedId);

      // Assert
      expect(tested.combinedIdString).toBeUndefined();
      expect(tested.source).toBeUndefined();
      expect(tested.iModelId).toBeUndefined();
      expect(tested.iTwinId).toBeUndefined();
      expect(tested.resourceId).toBeUndefined();
    });
    it("return empty fields if invalid source", () => {
      // Arrange
      const source = -1;
      const resourceId = "2560be6f-ef84-475d-85c0-c4833ab74bb5";
      const iTwinId = "2560be6f-ef84-475d-85c0-c4833ab74bb5";

      // Act
      const tested = new CombinedId(source, resourceId, iTwinId);

      // Assert
      expect(tested.combinedIdString).toBeUndefined();
      expect(tested.source).toBeUndefined();
      expect(tested.iModelId).toBeUndefined();
      expect(tested.iTwinId).toBeUndefined();
      expect(tested.resourceId).toBeUndefined();
    });
    it("return empty fields if invalid ids", () => {
      // Arrange
      const source = 0;
      const invalidId1 = "Id";
      const iTwinId = "2560be6f-ef84-475d-85c0-c4833ab74bb5";
      const iModelId = "2560be6f-ef84-475d-85c0-c4833ab74bb5";

      // Act
      const tested = new CombinedId(source, invalidId1, iTwinId, iModelId);

      // Assert
      expect(tested.combinedIdString).toBeUndefined();
      expect(tested.source).toBeUndefined();
      expect(tested.iModelId).toBeUndefined();
      expect(tested.iTwinId).toBeUndefined();
      expect(tested.resourceId).toBeUndefined();
    });
    it("return correct fields if valid ids (uuids)", () => {
      // Arrange
      const source = 0;
      const resourceId = "2560be6f-ef84-475d-85c0-c4833ab74bb5";
      const iTwinId = "2560be6f-ef84-475d-85c0-c4833ab74bb5";
      const combined = "AG--YCWE711HhcDEgzq3S7VvvmAlhO9dR4XAxIM6t0u1";

      // Act
      const tested = new CombinedId(source, resourceId, iTwinId);

      // Assert
      expect(tested.combinedIdString).toEqual(combined);
      expect(tested.source).toEqual(source);
      expect(tested.iModelId).toBeUndefined();
      expect(tested.iTwinId).toEqual(iTwinId);
      expect(tested.resourceId).toEqual(resourceId);
    });
    it("return correct fields if valid combined id", () => {
      // Arrange
      const source = 0;
      const resourceId = "2560be6f-ef84-475d-85c0-c4833ab74bb5";
      const iTwinId = "2560be6f-ef84-475d-85c0-c4833ab74bb5";
      const combined = "AG--YCWE711HhcDEgzq3S7VvvmAlhO9dR4XAxIM6t0u1";

      // Act
      const tested = new CombinedId(combined);

      // Assert
      expect(tested.combinedIdString).toEqual(combined);
      expect(tested.source).toEqual(source);
      expect(tested.iModelId).toBeUndefined();
      expect(tested.iTwinId).toEqual(iTwinId);
      expect(tested.resourceId).toEqual(resourceId);
    });
    it("return correct fields if valid ids (3 with iModelId)", () => {
      // Arrange
      const id =
        "Am--YCWE711HhcDEgzq3S7X8w0o2NnSyRpNX-EA-VPhVb75gJYTvXUeTV_hAPlT4VQ";
      const source = 2;
      const resourceId = "2560be6f-ef84-475d-85c0-c4833ab74bb5";
      const iTwinId = "364ac3fc-7436-46b2-9357-f8403e54f855";
      const iModelId = "2560be6f-ef84-475d-9357-f8403e54f855";

      // Act
      const tested = new CombinedId(source, resourceId, iTwinId, iModelId);

      // Assert
      expect(tested.combinedIdString).toEqual(id);
      expect(tested.source).toEqual(source);
      expect(tested.iModelId).toEqual(iModelId);
      expect(tested.iTwinId).toEqual(iTwinId);
      expect(tested.resourceId).toEqual(resourceId);
    });
    it("return correct fields if valid combined id (with iModelId)", () => {
      // Arrange
      const id =
        "Am--YCWE711HhcDEgzq3S7X8w0o2NnSyRpNX-EA-VPhVb75gJYTvXUeTV_hAPlT4VQ";
      const source = 2;
      const resourceId = "2560be6f-ef84-475d-85c0-c4833ab74bb5";
      const iTwinId = "364ac3fc-7436-46b2-9357-f8403e54f855";
      const iModelId = "2560be6f-ef84-475d-9357-f8403e54f855";

      // Act
      const tested = new CombinedId(id);

      // Assert
      expect(tested.combinedIdString).toEqual(id);
      expect(tested.source).toEqual(source);
      expect(tested.iModelId).toEqual(iModelId);
      expect(tested.iTwinId).toEqual(iTwinId);
      expect(tested.resourceId).toEqual(resourceId);
    });
  });
  describe("static combine", () => {
    it("return url safe and trimmed encoded string", () => {
      // Arrange
      // Using these specific value because they generate base64 invalid characters and = paddings.
      const source = 0;
      const id = "2560be6f-ef84-475d-85c0-c4833ab74bb5";
      const id2 = "39977ea0-85c0-403e-9fc9-dc5c4d9b6ffc";
      const id3 = "47c23f02-bc94-4cd8-974b-fde4bbaa8973";

      // Act
      const tested = CombinedId.combine(source, id, id2, id3);

      // Assert
      expect(tested).not.toMatch(/[=+\/]/g); // Is safely encoded and trimmed
      expect(tested).toMatch(/-/); // Ensure that a + was replaced
      expect(tested).toMatch(/_/); // Ensure that a / was replaced
      expect(tested.length % 4).not.toEqual(0); // Ensure that = should have been there and was removed
    });
    it("return empty string if provided parameters are not valid UUID", () => {
      // Arrange
      const source = 0;
      const id = "test";
      const id2 = "364ac3fc-7436-46b2-9357-f8403e54f855";

      // Act
      const tested = CombinedId.combine(source, id, id2);

      // Assert
      expect(tested).toEqual("");
    });
    it("return empty string if source is negative", () => {
      // Arrange
      const source = -1;
      const id = "2560be6f-ef84-475d-85c0-c4833ab74bb5";
      const id2 = "364ac3fc-7436-46b2-9357-f8403e54f855";

      // Act
      const tested = CombinedId.combine(source, id, id2);

      // Assert
      expect(tested).toEqual("");
    });
    it("return encoded string for source up to 255", () => {
      // Arrange
      const source = 255;
      const id = "2560be6f-ef84-475d-85c0-c4833ab74bb5";
      const id2 = "364ac3fc-7436-46b2-9357-f8403e54f855";
      const combined = "_2--YCWE711HhcDEgzq3S7X8w0o2NnSyRpNX-EA-VPhV";

      // Act
      const tested = CombinedId.combine(source, id, id2);

      // Assert
      expect(tested).toEqual(combined);
    });
    it("return empty string if source is greater than 255", () => {
      // Arrange
      const source = 256;
      const id = "2560be6f-ef84-475d-85c0-c4833ab74bb5";
      const id2 = "364ac3fc-7436-46b2-9357-f8403e54f855";

      // Act
      const tested = CombinedId.combine(source, id, id2);

      // Assert
      expect(tested).toEqual("");
    });

    it("support 'undefined' values as iModelId parameter", () => {
      // Arrange
      const source = 255;
      const id = "2560be6f-ef84-475d-85c0-c4833ab74bb5";
      const id2 = "364ac3fc-7436-46b2-9357-f8403e54f855";
      const combined = "_2--YCWE711HhcDEgzq3S7X8w0o2NnSyRpNX-EA-VPhV";

      // Act
      const tested = CombinedId.combine(source, id, id2, undefined);

      // Assert
      expect(tested).toEqual(combined);
    });
    it("return empty string if resourceId is 'undefined'", () => {
      // Arrange
      const source = 0;
      const id = undefined;
      const id2 = "364ac3fc-7436-46b2-9357-f8403e54f855";

      // Act
      const tested = CombinedId.combine(source, id, id2);

      // Assert
      expect(tested).toEqual("");
    });
    it("return empty string if iTwinId is 'undefined'", () => {
      // Arrange
      const source = 0;
      const id = "2560be6f-ef84-475d-85c0-c4833ab74bb5";
      const id2 = undefined;

      // Act
      const tested = CombinedId.combine(source, id, id2);

      // Assert
      expect(tested).toEqual("");
    });
  });
  describe("static separate", () => {
    it("return undefined if provided parameter is not proper length", () => {
      // Arrange
      const id = "BA0FOGD/OD==";
      expect(isBase64(id)).toBeTruthy();

      // Act
      const tested = CombinedId.separate(id);

      // Assert
      expect(tested).toBeUndefined();
    });
    it("return undefined if provided parameter is not proper length (no iTwinId)", () => {
      // Arrange
      const id = "AG--YCWE711HhcDEgzq3S7U";

      // Act
      const tested = CombinedId.separate(id);

      // Assert
      expect(tested).toBeUndefined();
    });
    it("return undefined if provided parameters are not valid Id", () => {
      // Arrange
      const id = "364ac3fc-7436-46b2*9357-f8403e54f855";

      // Act
      const tested = CombinedId.separate(id);

      // Assert
      expect(tested).toBeUndefined();
    });
    it("return undefined on undefined", () => {
      // Arrange

      // Act
      const tested = CombinedId.separate();

      // Assert
      expect(tested).toBeUndefined();
    });
    it("return undefined on invalid guid value", () => {
      // Arrange
      const properlySizedInvalidValue =
        "____________________________________________";

      // Act
      const tested = CombinedId.separate(properlySizedInvalidValue);

      // Assert
      expect(tested).toBeUndefined();
    });
    it("return object with complete fields", () => {
      // Arrange
      const id =
        "Am--YCWE711HhcDEgzq3S7X8w0o2NnSyRpNX-EA-VPhVb75gJYTvXUeTV_hAPlT4VQ";
      const source = 2;
      const guid1 = "2560be6f-ef84-475d-85c0-c4833ab74bb5";
      const guid2 = "364ac3fc-7436-46b2-9357-f8403e54f855";
      const guid3 = "2560be6f-ef84-475d-9357-f8403e54f855";

      // Act
      const tested = CombinedId.separate(id);

      // Assert
      expect(tested).toEqual({
        source,
        resourceId: guid1,
        iTwinId: guid2,
        iModelId: guid3,
      });
    });
  });
});
