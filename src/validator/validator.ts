import { accept_funcs } from "./accept-funcs";

export const validateFormatBlock = (formatBlock: any): ValidationResult => {
  const formatCheck = checkIsArray(formatBlock.formats);
  if (!formatCheck.isValid) {
    return formatCheck;
  }
  // changesが配列であるかどうかをチェックする
  for (const format of formatBlock.formats) {
    const changesCheck = checkIsArray(format.changes);
    if (!changesCheck.isValid) {
      return changesCheck;
    }

    for (const change of format.changes) {
      const valueCheck = checkCssValue(change.cssValue);
      if (!valueCheck.isValid) {
        return valueCheck;
      }
    }
  }
  return { isValid: true };
};

const checkCssValue = (cssValue: string): ValidationResult => {
  // 文字列中の関数名をすべて取得して配列にする
  for (const func of cssValue.matchAll(/(?<![a-z])[a-z]+\s*\(/g) || []) {
    // 関数名を取得する
    const funcName = func[0].split("(")[0].trim();
    // 関数名が受け入れられているかどうかをチェックする
    if (accept_funcs.includes(funcName)) {
      continue;
    } else {
      return {
        isValid: false,
        message: `css function name ${funcName} is not accepted`,
      };
    }
  }
  return { isValid: true };
};

const checkIsArray = (checkProp: any): ValidationResult => {
  if (!Array.isArray(checkProp)) {
    return {
      isValid: false,
      message: "formatBlocks is not array",
    };
  }
  return { isValid: true };
};

export type ValidationResult =
  | {
      isValid: true;
    }
  | {
      isValid: false;
      message: string;
    };
