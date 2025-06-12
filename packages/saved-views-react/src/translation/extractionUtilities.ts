/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { ColorDef } from "@itwin/core-common";

import type { Rgba, RgbatColorProps } from "./RgbColor.js";
import { LinePixels } from "@itwin/saved-views-client";

/**
 * Returns a function that does a simple typeof check on a value
 * @param typeOfString String to compare against
 * @returns
 */
export const simpleTypeOf = (typeOfString: string) => {
  return (value: unknown) => typeof value === typeOfString;
};

/**
 * Type check for colors in format {r: number, g: number, b:number}
 * @param value
 * @returns
 */
const isRgbColorProps = (value: unknown): value is Rgba => {
  return (
    typeof value === "object" &&
    value !== null &&
    "r" in value &&
    typeof (value as Rgba).r === "number" &&
    "g" in value &&
    typeof (value as Rgba).g === "number" &&
    "b" in value &&
    typeof (value as Rgba).b === "number"
  );
};

/**
 * Type check for colors in our schema format {red: number, green: number, blue: number}
 * @param value
 * @returns
 */
const isSchemaRgbColor = (value: unknown): value is RgbatColorProps => {
  return (
    typeof value === "object" &&
    value !== null &&
    "red" in value &&
    typeof (value as RgbatColorProps).red === "number" &&
    "green" in value &&
    typeof (value as RgbatColorProps).green === "number" &&
    "blue" in value &&
    typeof (value as RgbatColorProps).blue === "number"
  );
};

/**
 * Returns true if the value is a ColorDef, which is simply a number
 * @param value
 * @returns
 */
const isColorDef = (value: number) => {
  return ColorDef.isValidColor(value);
};

/**
 * Returns true if the given value is in any of the color formats that we accept to transform
 * @param value
 * @returns
 */
export const isAnyColorFormat = (value: unknown) =>
  isColorDef(value as number) ||
  isRgbColorProps(value as Rgba) ||
  isSchemaRgbColor(value as RgbatColorProps);

// data format is broken into bits for storage of color
// data format is 0xTTBBGGRR
// where TT is the transparency bits
// BB GG RR are the color bits (BB =blue GG= green RR= red)
// something that if fully one color would be FF or 1111 1111
const mapColorsToBitShiftedEquivalent = (
  color: RgbatColorProps,
): RgbatColorProps => {
  const colorCodeRed = color.red; //0x 00 00 00 RR   Binary  0000 0000 0000 0000 0000 0000 RRRR RRRR
  const colorCodeGreen = color.green << 8; //0x 00 00 GG 00 Binary  0000 0000 0000 0000 GGGG GGGG 0000 0000
  const colorCodeBlue = color.blue << 16; //0x 00 BB 00 00 Binary  0000 0000 BBBB BBBB 0000 0000 0000 0000
  const colorCodeTransparency = (color.transparency ?? 0) << 24; //0x TT 00 00 00 Binary  TTTT TTTT 0000 0000 0000 0000 0000 0000
  return {
    red: colorCodeRed,
    green: colorCodeGreen,
    blue: colorCodeBlue,
    transparency: colorCodeTransparency,
  };
};

/**
 * Transforms new color value object into color format  0xTTBBGGRR  value new schema ({red: number,green: number,blue:number, alpha?: number ,transparency})
 * @param value
 * @returns color value that is  0xTTBBGGRR
 */
const transformSchemaColor = (value: RgbatColorProps) => {
  const color: RgbatColorProps = {
    red: value.red,
    green: value.green,
    blue: value.blue,
    transparency: value.alpha ? 255 - value.alpha : 0,
  };
  const colorsBitShifted = mapColorsToBitShiftedEquivalent(color);
  // mix colors codes together using bit shifted or operator
  const combineBitsForFinalColorCode = (colorsBitShifted: RgbatColorProps) => {
    return (
      colorsBitShifted.red |
      colorsBitShifted.green |
      colorsBitShifted.blue |
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      color.transparency!
    );
  };
  return combineBitsForFinalColorCode(colorsBitShifted);
};

const createRGB = (value: RgbatColorProps): Rgba => {
  return {
    r: value.red,
    g: value.green,
    b: value.blue,
  };
};
/**
 * Transforms a vanilla value into our format {red: number,green: number,blue:number, alpha?: number}
 * @param value
 * @returns
 */
const transformSchemaColorLegacy = (value: RgbatColorProps) => {
  const color: RgbatColorProps = {
    red: value.red,
    green: value.green,
    blue: value.blue,
  };
  if (value.alpha) {
    color.alpha = value.alpha;
  }
  return color;
};
/**
 * Transform RgbColorProps {r,g,b} to our schema {red,green,blue}
 * @param value
 * @returns
 */
const transformRgbColorPropsLegacy = (value: Rgba) => {
  const color: RgbatColorProps = {
    red: value.r,
    green: value.g,
    blue: value.b,
  };
  if (value?.a !== undefined) {
    color.alpha = value?.a;
  }
  return color;
};
/**
 * Transform ColorDef 0xTTBBGGRR to our schema {red,green,blue,alpha if existent}
 * @param value
 */
const transformColorDefLegacy = (value: number) => {
  const color: RgbatColorProps = {
    red: value & 0xff,
    green: (value & 0xff00) >> 8,
    blue: (value & 0xff0000) >> 16,
  };
  // Extract alpha from transparency
  if ((value & 0xff000000) !== 0) {
    color.alpha = 255 - ((value & 0xff000000) >> 24);
  }
  return color;
};
/**
 * Transforms any of the three types of colors into our schema color format {red: number, green: number, blue: number}
 * Legacy to new schema
 * @param value
 * @returns
 */
export const transformColorLegacy = (value: unknown) => {
  // No need to extract if already follows schema convention
  if (isSchemaRgbColor(value as RgbatColorProps)) {
    return transformSchemaColorLegacy(value as RgbatColorProps);
  }

  // Extract RgbColorProps format
  if (isRgbColorProps(value as Rgba)) {
    return transformRgbColorPropsLegacy(value as Rgba);
  }

  // Extract 0xTTBBGGRR format
  if (isColorDef(value as number)) {
    return transformColorDefLegacy(value as number);
  }

  return undefined;
};

/**
 * Transforms any of the two types of colors into our schema color format 0xttbbggrr
 * @param value
 * @returns
 */
export const transformColor = (value: unknown) => {
  // Transform New Schema Into Legacy Schema( Color Def)
  if (isSchemaRgbColor(value as RgbatColorProps)) {
    return transformSchemaColor(value as RgbatColorProps);
  }

  // Extract 0xTTBBGGRR format we want this format
  if (isColorDef(value as number)) {
    return value;
  }

  return undefined;
};

/**
 * Transforms any of the three types of colors into our schema color format {r: number, g: number, b: number}
 * @param value
 * @returns
 */
export const transformRGB = (value: unknown) => {
  // Extract RgbColorProps format
  if (isSchemaRgbColor(value as RgbatColorProps)) {
    return createRGB(value as RgbatColorProps);
  }
  //is already the proper format
  if (isRgbColorProps(value)) {
    return value;
  }
  return undefined;
};

/**
 * Creates a function that extracts a value from input to output
 * @param from Accessor from where to retrieve the value
 * @param to Accessor to add to the output object to store the value
 * @param typeCheck Type checker for validation of the value
 * @param transform Transform function of the value to be put in the output
 * @returns Function that does the extraction
 */
export const createExtractionFunc = (
  from: string,
  to: string,
  typeCheck?: (value: unknown) => boolean,
  transform?: (value: unknown) => unknown,
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (input: any, output: any) => {
    if (input[from] !== undefined && (!typeCheck || typeCheck(input[from]))) {
      output[to] = transform ? transform(input[from]) : input[from];
    }
  };
};

/** Type for a extraction function generator */
export type ExtractionFunc<InputType, OutputType> = (
  input: InputType,
  output: OutputType
) => OutputType;
/** Type for a function that creates a extraction function */
export type ExtractionFuncCreator = (
  from: string,
  to: string
) => ExtractionFunc<void, void>;

/**
 * Creates a extraction function that will extract a number from the given accessor and put it
 * in the given accessor if provided
 * @param from Accessor that will be used on input to access value
 * @param to Accessor that will be used to stored the value in the output object
 * @returns Function that extracts a number value and type checks it
 */
export const extractNumber = (
  from: string,
  to?: string,
): ExtractionFunc<void, void> => {
  return createExtractionFunc(from, to ?? from, simpleTypeOf("number"));
};

/**
 * Creates a extraction function that will extract a number from the given accessor, transform it into a LinePixels enum, and put it
 * in the given accessor if provided
 * @param from Accessor that will be used on input to access value
 * @param to Accessor that will be used to stored the value in the output object
 * @returns Function that extracts a number value and type checks it
 */
export const extractLinePixels = (
  from: string,
  to?: string,
): ExtractionFunc<void, void> => {
  return createExtractionFunc(
    from,
    to ?? from,
    simpleTypeOf("number"),
    (value: unknown) => {
      if (
        typeof value !== "number" ||
        !Object.keys(LinePixels).includes(value.toString())
      )
        return LinePixels.Invalid;

      return value;
    },
  );
};

/**
 * Creates a extraction function that will extract a boolean from the given accessor and put it
 * in the given accessor if provided
 * @param from Accessor that will be used on input to access value
 * @param to Accessor that will be used to stored the value in the output object
 * @returns Function that extracts a boolean value and type checks it
 */
export const extractBoolean = (
  from: string,
  to?: string,
): ExtractionFunc<void, void> => {
  return createExtractionFunc(from, to ?? from, simpleTypeOf("boolean"));
};

/**
 * Creates a extraction function that will extract a boolean or a number with the same accessor name
 * @param from Accessor that will be used on input to access value
 * @param to Accessor that will be used to stored the value in the output object
 * @returns Function that extracts a boolean or number value and type checks it
 */
export const extractNumberOrBool = (
  from: string,
  to?: string,
): ExtractionFunc<void, void> => {
  return createExtractionFunc(
    from,
    to ?? from,
    (value) => typeof value === "number" || typeof value === "boolean",
  );
};

/**
 * Creates a extraction function that will extract a string from the given accessor and put it
 * in the given accessor if provided
 * @param from Accessor that will be used on input to access value
 * @param to Accessor that will be used to stored the value in the output object
 * @returns Function that extracts a string value and type checks it
 */
export const extractString = (
  from: string,
  to?: string,
): ExtractionFunc<void, void> => {
  return createExtractionFunc(from, to ?? from, simpleTypeOf("string"));
};

/**
 * Creates a extraction function that will extract a string or number from them given accessor
 * @param from Accessor that will be used on input to access value
 * @param to Accessor that will be used to stored the value in the output object
 * @returns Function that extracts a string or number value and type checks it
 */
export const extractStringOrNumber = (
  from: string,
  to?: string,
): ExtractionFunc<void, void> => {
  return createExtractionFunc(
    from,
    to ?? from,
    (value: unknown) => typeof value === "number" || typeof value === "string",
  );
};

/**
 * Creates a extraction function that will extract a string or an array of strings into the given
 * accessor
 * @param from Accessor that will be used on input to access value
 * @param to Accessor that will be used to stored the value in the output object
 * @returns Function that extracts a string or string array value and type checks it
 */
export const extractStringOrArray = (
  from: string,
  to?: string,
): ExtractionFunc<void, void> => {
  return createExtractionFunc(
    from,
    to ?? from,
    (value: unknown) =>
      typeof value === "string" ||
      (Array.isArray(value) &&
        value.every((inner: unknown) => typeof inner === "string")),
  );
};

/**
 * Creates a extraction function that will extract an array of type: (string | number)[]
 * @param from Accessor that will be used on input to access value
 * @param to Accessor that will be used to stored the value in the output object
 * @returns Function that extracts a string | number array value and type checks it
 */
export const extractStringOrNumberArray = (
  from: string,
  to?: string,
): ExtractionFunc<void, void> => {
  return createExtractionFunc(
    from,
    to ?? from,
    (value: unknown) =>
      Array.isArray(value) &&
      value.every(
        (val: unknown) => typeof val === "number" || typeof val === "string",
      ),
  );
};

/**
 * Creates a extraction function that will extract an array in which all the elements are type checked with the
 * given function
 * @param typeCheck Function to check each value of the array
 * @param from Accessor string where the array is in the input object
 * @param to Accessor string to store it in the output object
 * @returns
 */
export const extractSimpleArray = (
  typeCheck: (value: unknown) => boolean,
  from: string,
  to?: string,
): ExtractionFunc<void, void> => {
  return createExtractionFunc(
    from,
    to ?? from,
    (value: unknown) =>
      Array.isArray(value) && value.every((val: unknown) => typeCheck(val)),
  );
};

/**
 * Creates a extraction function that will extract a color from the given accessor and put it
 * in the given accessor if provided. Colors will be transformed from either of the following representations:
 * 1. Number in format: 0xTTBBGGRR
 * 2. JSON Object in format: {r: number, g: number, b: number}
 * 3. JSON Object in format: {red: number, green: number, blue: number}
 *
 * The resulting transformed color will be in format: {red: number, green: number, blue: number}
 *
 * @param from Accessor that will be used on input to access value
 * @param to Accessor that will be used to store the value in the output object
 * @returns Function that extracts a color value and type checks it
 */
export const extractColor = (
  from: string,
  to?: string,
): ExtractionFunc<void, void> => {
  return createExtractionFunc(
    from,
    to ?? from,
    isAnyColorFormat,
    transformColor,
  );
};

/**
 * Creates a extraction function that will extract a color from the given accessor and put it
 * in the given accessor if provided. Colors will be transformed from either of the following representations:
 * 1. Number in format: 0xTTBBGGRR
 * 2. JSON Object in format: {r: number, g: number, b: number}
 * 3. JSON Object in format: {red: number, green: number, blue: number}
 *
 * The resulting transformed color will be in format: {red: number, green: number, blue: number}
 *
 * @param from Accessor that will be used on input to access value
 * @param to Accessor that will be used to store the value in the output object
 * @returns Function that extracts a color value and type checks it
 */
export const extractColorLegacy = (
  from: string,
  to?: string,
): ExtractionFunc<void, void> => {
  return createExtractionFunc(
    from,
    to ?? from,
    isAnyColorFormat,
    transformColorLegacy,
  );
};

/**
 * Creates a extraction function that will extract a color from RBG format
 *
 * @param from Accessor that will be used on input to access value
 * @param to Accessor that will be used to store the value in the output object
 * @returns Function that extracts a color value and type checks it
 */
export const extractRGB = (
  from: string,
  to?: string,
): ExtractionFunc<void, void> => {
  return createExtractionFunc(from, to ?? from, isAnyColorFormat, transformRGB);
};

/**
 * Creates a extraction function that will extract an array of mappings from an object with the given accessor
 * @param extractionFuncs Array of extraction functions
 * @param from Accessor that will be used on input to access value
 * @param to Accessor that will be used to store the value in the output object
 * @returns Function that extracts an object
 */
export const extractObject = (
  extractionFuncs: ExtractionFunc<void, void>[],
  from: string,
  to?: string,
): ExtractionFunc<void, void> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (input: any, output: any) => {
    const adjustedTo = to ?? from;
    if (input[from] !== undefined) {
      output[adjustedTo] = {};
      extractionFuncs.forEach((func: ExtractionFunc<void, void>) =>
        func(input[from], output[adjustedTo]),
      );
    }
  };
};

/**
 * Interface to pass a discriminator and an array of extraction functions
 * To the extractConditionally function
 */
export interface ConditionalExtractParams {
  /** Accessor name that if found on the object matches these mappings to it */
  discriminator: string | ((value: unknown) => boolean);
  /**
   * If an array is passed, the extraction functions are applied to the child to extract
   * If the single creator function is passed, then that function is applied to the parent object
   */
  mappings: ExtractionFunc<void, void>[] | ExtractionFuncCreator;
}

/**
 * Returns true if the value matches the discriminator
 * @param value Value to check
 * @param discriminator String to check for an accessor or function that determines whether or not a value is proper
 */
const objectMatchesDiscriminator = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
  discriminator: string | ((value: unknown) => boolean),
) => {
  if (typeof discriminator === "string") {
    return value[discriminator] !== undefined;
  }

  return discriminator(value);
};

/**
 * Creates an extraction function that will extract different values based on a discriminator string
 * This is to allow extracting types like 'ClassA | ClassB'
 * @param params
 * @param from
 * @param to
 * @returns
 */
export const extractConditionally = (
  params: ConditionalExtractParams[],
  from: string,
  to?: string,
): ExtractionFunc<void, void> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (input: any, output: any) => {
    const adjustedTo = to ?? from;
    if (input[from] !== undefined) {
      for (const param of params) {
        // Check that the discriminator prop exist
        if (objectMatchesDiscriminator(input[from], param.discriminator)) {
          // If so, then apply the necessary extraction functions
          output[adjustedTo] = {};
          if (Array.isArray(param.mappings)) {
            // Apply each extraction func to the inner object
            param.mappings.forEach((func: ExtractionFunc<void, void>) =>
              func(input[from], output[adjustedTo]),
            );
          } else {
            // Apply the extraction func to the object directly
            param.mappings(from, to ?? from)(input, output);
          }
        }
      }
    }
  };
};

/**
 * Creates a extraction function that will extract values of an array by using a single extraction function
 * on each of the array values
 * @param extractionFunc
 */
export const extractArray = (
  extractionFunc: ExtractionFunc<void, void>[],
  from: string,
  to?: string,
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (input: any, output: any) => {
    const adjustedTo = to ?? from;
    if (input[from] !== undefined && Array.isArray(input[from])) {
      output[adjustedTo] = [];
      (input[from] as unknown[]).forEach((_: unknown, index: number) => {
        output[adjustedTo].push({});
        extractionFunc.forEach((func: ExtractionFunc<void, void>) =>
          func(input[from][index], output[adjustedTo][index]),
        );
      });
    }
  };
};

/**
 * Creates an extraction function that will extract each value of an array if it meets the given condition
 * by using a single extraction function on each of the array values
 * @param condition Function that checks if the value should be extracted
 * @param extractionFunc Array of extraction functions to apply to each value in the array that meets the condition
 * @param from Accessor string where the array is in the input object
 * @param to Accessor string to store it in the output object
 * @returns Function that extracts an array of values conditionally
 */
export const extractArrayElementsConditionally = (
  condition: (value: any) => boolean,
  extractionFunc: ExtractionFunc<void, void>[],
  from: string,
  to?: string,
) => {
  return (input: any, output: any) => {
    const adjustedTo = to ?? from;
    if (input[from] !== undefined && Array.isArray(input[from])) {
      output[adjustedTo] = [];
      let outputIndex = 0;
      (input[from] as unknown[]).forEach((_: unknown, index: number) => {
        if (condition(input[from][index])) {
          output[adjustedTo].push({});
          extractionFunc.forEach((func: ExtractionFunc<void, void>) =>
            func(input[from][index], output[adjustedTo][outputIndex]),
          );
          outputIndex++;
        }
      });
    }
  };
};

/**
 * Creates an extraction function that will extract the values inside a 2D array from the given accessor
 * @param extractionFunc Extraction functions to apply to each entry in the array
 * @param from Accessor string for the 2D array in the input object
 * @param to Accessor string for the 2D array in the output object
 */
export const extractArray2d = (
  extractionFunc: ExtractionFunc<void, void>[],
  from: string,
  to?: string,
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (input: any, output: any) => {
    if (
      Array.isArray(input[from]) &&
      input[from].every((inner: unknown) => Array.isArray(inner))
    ) {
      const adjustedTo = to ?? from;
      output[adjustedTo] = [];
      for (let i = 0; i < input[from].length; ++i) {
        output[adjustedTo].push([]);
        for (let j = 0; j < input[from][i].length; ++j) {
          output[adjustedTo][i].push({});
          extractionFunc.forEach((func: ExtractionFunc<void, void>) =>
            func(input[from][i][j], output[adjustedTo][i][j]),
          );
        }
      }
    }
  };
};

/**
 * Creates a extraction function that will extract values of an array by using different extraction functions
 * based on a discriminator for each array value. This is to extract arrays of types like (ClassA | ClassB)[]
 * @param extractionFunc
 */
export const extractArrayConditionally = (
  params: ConditionalExtractParams[],
  from: string,
  to?: string,
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (input: any, output: any) => {
    const adjustedTo = to ?? from;
    if (input[from] !== undefined && Array.isArray(input[from])) {
      output[adjustedTo] = [];
      (input[from] as unknown[]).forEach((_: unknown, index: number) => {
        output[adjustedTo].push({});
        for (const param of params) {
          // Check that the discriminator matches with the object
          if (
            objectMatchesDiscriminator(input[from][index], param.discriminator)
          ) {
            // If so, then apply the necessary extraction functions
            if (Array.isArray(param.mappings)) {
              param.mappings.forEach((func: ExtractionFunc<void, void>) =>
                func(input[from][index], output[adjustedTo][index]),
              );
            } else {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              param.mappings(index as any, index as any)(
                input[from],
                output[adjustedTo],
              );
            }
          }
        }
      });
    }
  };
};

/**
 * Creates an extraction function that will extract a plain typed map
 * @param extractionFuncs Extraction functions for the values
 * @param isValidKey Checker for the validity of the key
 * @param from Accessor where the plain typed map exists
 * @param to Accessor to store the plain typed map to
 * @returns
 */
export const extractPlainTypedMap = (
  extractionFuncs: ExtractionFunc<void, void>[],
  isValidKey: (key: unknown) => boolean,
  from: string,
  to?: string,
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (input: any, output: any) => {
    if (input[from] !== undefined) {
      const adjustedTo = to ?? from;
      output[adjustedTo] = {};
      for (const prop in input[from]) {
        if (isValidKey(prop)) {
          output[adjustedTo][prop] = {};
          extractionFuncs.forEach((func: ExtractionFunc<void, void>) =>
            func(input[from][prop], output[adjustedTo][prop]),
          );
        }
      }
    }
  };
};

/**
 * Applies an array of extraction functions to extract the data from the input object
 * into the output object
 * @param input Object to extract data from
 * @param output Object to map the data to
 * @param extractionFuncs Array of extraction functions
 */
export const applyExtraction = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  output: any,
  extractionFuncs: ExtractionFunc<void, void>[],
) => {
  extractionFuncs.forEach((func: ExtractionFunc<void, void>) =>
    func(input, output),
  );
};
