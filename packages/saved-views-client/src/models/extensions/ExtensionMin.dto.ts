// Copyright (c) Bentley Systems, Incorporated. All rights reserved.
import { Link } from "../Links.dto";
import { ExtensionBase } from "./Extension.dto";

/**
 * Extension metadata model for restful get extension operations following Apim standards.
 */
export interface ExtensionMin extends Link, ExtensionBase {}
