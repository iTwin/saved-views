/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Link } from "../Links.dto";
import { ExtensionBase } from "./Extension.dto";

/**
 * Extension metadata model for restful get extension operations following Apim standards.
 */
export interface ExtensionMin extends Link, ExtensionBase { }
