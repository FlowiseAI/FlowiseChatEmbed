/**
 * 한글, 영어, 특수문자의 글자 넓이 차이를 고려하여 텍스트를 일정한 길이로 자르는 함수
 * @param text 원본 텍스트
 * @param maxWidth 최대 너비 (한글 기준 글자 수)
 * @returns 잘린 텍스트
 */
export function truncateTextByWidth(text: string, maxWidth: number): string {
  if (!text || text.length === 0) return '';

  // 줄바꿈 문자를 공백으로 변환
  const cleanText = text.replace(/\n/g, ' ');

  let currentWidth = 0;
  let truncatedText = '';

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const charWidth = getCharWidth(char);

    // 현재 글자를 추가했을 때 최대 너비를 초과하는지 확인
    if (currentWidth + charWidth > maxWidth) {
      break;
    }

    truncatedText += char;
    currentWidth += charWidth;
  }

  // 텍스트가 잘렸다면 '...' 추가
  if (truncatedText.length < cleanText.length) {
    truncatedText += '...';
  }

  return truncatedText;
}

/**
 * 개별 문자의 너비를 계산하는 함수
 * @param char 문자
 * @returns 문자의 너비 (한글 기준 단위)
 */
function getCharWidth(char: string): number {
  const code = char.charCodeAt(0);

  // 한글 (가-힣): 2.0
  if (code >= 0xac00 && code <= 0xd7af) {
    return 2.0;
  }

  // 한글 자모 (ㄱ-ㅎ): 1.5
  if (code >= 0x3131 && code <= 0x318e) {
    return 1.5;
  }

  // 전각 문자 (일부 특수문자): 2.0
  if (code >= 0xff01 && code <= 0xff5e) {
    return 2.0;
  }

  // 전각 숫자: 2.0
  if (code >= 0xff10 && code <= 0xff19) {
    return 2.0;
  }

  // 전각 영문자: 2.0
  if ((code >= 0xff21 && code <= 0xff3a) || (code >= 0xff41 && code <= 0xff5a)) {
    return 2.0;
  }

  // 공백: 1.0
  if (char === ' ') {
    return 1.0;
  }

  // 영어, 숫자, 일반 특수문자: 1.0
  return 1.5;
}

/**
 * 텍스트의 실제 너비를 계산하는 함수
 * @param text 텍스트
 * @returns 텍스트의 총 너비
 */
export function getTextWidth(text: string): number {
  if (!text) return 0;

  return text.split('').reduce((total, char) => {
    return total + getCharWidth(char);
  }, 0);
}
