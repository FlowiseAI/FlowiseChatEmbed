import { truncateTextByWidth, getTextWidth } from './textTruncator';

// 테스트 함수들
function runTests() {
  console.log('=== 텍스트 자르기 함수 테스트 ===\n');

  // 테스트 케이스들
  const testCases = [
    {
      text: 'Hello World!',
      maxWidth: 10,
      description: '영어 텍스트 (10글자 너비)'
    },
    {
      text: '안녕하세요 반갑습니다',
      maxWidth: 10,
      description: '한글 텍스트 (10글자 너비)'
    },
    {
      text: 'Hello 안녕하세요!',
      maxWidth: 10,
      description: '영어+한글 혼합 (10글자 너비)'
    },
    {
      text: '１２３４５６７８９０',
      maxWidth: 10,
      description: '전각 숫자 (10글자 너비)'
    },
    {
      text: 'ＡＢＣＤＥＦＧＨＩＪ',
      maxWidth: 10,
      description: '전각 영문자 (10글자 너비)'
    },
    {
      text: 'Hello 안녕하세요! １２３',
      maxWidth: 15,
      description: '복합 텍스트 (15글자 너비)'
    }
  ];

  testCases.forEach((testCase, index) => {
    console.log(`테스트 ${index + 1}: ${testCase.description}`);
    console.log(`원본 텍스트: "${testCase.text}"`);
    console.log(`원본 너비: ${getTextWidth(testCase.text)}`);
    
    const truncated = truncateTextByWidth(testCase.text, testCase.maxWidth);
    console.log(`잘린 텍스트: "${truncated}"`);
    console.log(`잘린 텍스트 너비: ${getTextWidth(truncated)}`);
    console.log(`최대 너비: ${testCase.maxWidth}`);
    console.log('---');
  });

  // 특수 케이스 테스트
  console.log('=== 특수 케이스 테스트 ===\n');
  
  console.log('빈 문자열 테스트:');
  console.log(`빈 문자열: "${truncateTextByWidth('', 10)}"`);
  console.log(`null: "${truncateTextByWidth(null as any, 10)}"`);
  console.log(`undefined: "${truncateTextByWidth(undefined as any, 10)}"`);
  console.log('---');

  console.log('줄바꿈 문자 포함 텍스트:');
  const textWithNewlines = 'Hello\n안녕하세요\nWorld!';
  console.log(`원본: "${textWithNewlines}"`);
  console.log(`처리 후: "${truncateTextByWidth(textWithNewlines, 15)}"`);
}

// 브라우저 환경에서 실행
if (typeof window !== 'undefined') {
  // 개발 모드에서만 테스트 실행
  if (process.env.NODE_ENV === 'development') {
    runTests();
  }
}

export { runTests };
