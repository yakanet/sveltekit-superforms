import type { ValidationErrors } from '.';
import {
  type ZodTypeAny,
  ZodDefault,
  ZodNullable,
  ZodOptional,
  ZodEffects,
  type AnyZodObject,
  type ZodFormattedError
} from 'zod';

export type ZodTypeInfo = {
  zodType: ZodTypeAny;
  isNullable: boolean;
  isOptional: boolean;
  hasDefault: boolean;
  defaultValue: unknown;
};

export function unwrapZodType(zodType: ZodTypeAny): ZodTypeInfo {
  let _wrapped = true;
  let isNullable = false;
  let isOptional = false;
  let hasDefault = false;
  let defaultValue: unknown = undefined;

  //let i = 0;
  while (_wrapped) {
    //console.log(' '.repeat(++i * 2) + zodType.constructor.name);
    if (zodType instanceof ZodNullable) {
      isNullable = true;
      zodType = zodType.unwrap();
    } else if (zodType instanceof ZodDefault) {
      hasDefault = true;
      defaultValue = zodType._def.defaultValue();
      zodType = zodType._def.innerType;
    } else if (zodType instanceof ZodOptional) {
      isOptional = true;
      zodType = zodType.unwrap();
    } else if (zodType instanceof ZodEffects) {
      zodType = zodType._def.schema;
    } else {
      _wrapped = false;
    }
  }

  return {
    zodType,
    isNullable,
    isOptional,
    hasDefault,
    defaultValue
  };
}

export function mapErrors<T extends AnyZodObject>(
  obj: ZodFormattedError<unknown>
) {
  const output: Record<string, unknown> = {};
  const entries = Object.entries(obj);

  if (
    entries.length === 1 &&
    entries[0][0] === '_errors' &&
    obj._errors.length
  ) {
    return obj._errors as unknown as ValidationErrors<T>;
  } else if (obj._errors.length) {
    output._errors = obj._errors;
  }

  for (const [key, value] of entries.filter(([key]) => key !== '_errors')) {
    // _errors are filtered out, so casting is fine
    output[key] = mapErrors(value as unknown as ZodFormattedError<unknown>);
  }

  return output as ValidationErrors<T>;
}

export function findErrors(
  errors: ValidationErrors<AnyZodObject>,
  path: string[] = []
): { path: string[]; message: string }[] {
  const entries = Object.entries(errors);
  return entries.flatMap(([key, value]) => {
    if (Array.isArray(value) && value.length > 0) {
      const currPath = path.concat([key]);
      return value.map((message) => ({ path: currPath, message }));
    } else {
      return findErrors(
        errors[key] as ValidationErrors<AnyZodObject>,
        path.concat([key])
      );
    }
  });
}

/* eslint-disable @typescript-eslint/no-explicit-any */

type PathData = {
  parent: any;
  key: string;
  value: any;
};

export function checkPath(
  obj: any,
  path: string[],
  modifier?: (data: PathData) => undefined | unknown | void
): PathData | undefined {
  if (!path.length) return undefined;
  path = [...path];

  let parent = obj;

  while (path.length > 1) {
    const key = path.shift() || '';
    const value = modifier
      ? modifier({ parent, key, value: parent[key] })
      : parent[key];

    if (value === undefined) return undefined;
    else parent = value;
  }

  const key = path[0];
  return { parent, key, value: parent[key] };
}