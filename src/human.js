// src/human.js

const HUMAN_KEYWORDS = {
  ko: ['사람', '직원', '상담원', '도움말', '연결해줘', '사람이랑 얘기'],
  en: [
    'human', 'agent', 'staff', 'real person',
    'help me', 'help', 'connect me', 'talk to someone',
    'speak to someone', 'i need help', 'need help',
  ],
  id: [
    'manusia', 'petugas', 'staf', 'bantuan langsung',
    'bantuan', 'tolong', 'minta bantuan',
  ],
};

const FAIL_THRESHOLD = 3;

export function isHumanRequest(text = '') {
  const t = text.toLowerCase();
  return Object.values(HUMAN_KEYWORDS).flat().some((k) => t.includes(k.toLowerCase()));
}

export function incrementFailCount(session) {
  session.failCount = (session.failCount || 0) + 1;
  return session.failCount;
}

export function shouldEscalate(session) {
  return (session.failCount || 0) >= FAIL_THRESHOLD;
}

export async function notifyHumanViaLine({ userId, userMessage, lang, reason }) {
  const HELPER_LINE_USER_ID = process.env.HELPER_LINE_USER_ID;
  const LINE_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!HELPER_LINE_USER_ID || !LINE_ACCESS_TOKEN) {
    console.error('HELPER_LINE_USER_ID or LINE_CHANNEL_ACCESS_TOKEN not set');
    return false;
  }

  const reasonLabel = {
    manual: '사용자 직접 요청',
    keyword: '도우미 키워드 감지',
    ai_fail: 'AI 응답 실패',
    threshold: `대화 실패 누적 ${FAIL_THRESHOLD}회`,
    visa: '비자 연장 문의',
    jobs: '직업 소개 문의',
    delivery: '물품 배달 문의',
    guide: '하루 가이드 문의',
    transport: '교통/길찾기 문의',
    emergency: '긴급 상황',
  }[reason] || reason;

  const message = [
    '🔔 VirtualButler 상담 요청',
    `📌 사유: ${reasonLabel}`,
    `🌐 언어: ${lang}`,
    `👤 사용자 ID: ${userId}`,
    `💬 마지막 메시지: ${userMessage}`,
    `🕐 시각: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`,
    '',
    '💡 대화 종료 후 봇 재활성화:',
    '→ LINE Manager에서 유저에게 "#end" 입력',
  ].join('\n');

  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: HELPER_LINE_USER_ID,
        messages: [{ type: 'text', text: message }],
      }),
    });

    if (!res.ok) {
      console.error('LINE push failed:', await res.text());
      return false;
    }

    console.log(`[HUMAN] Notified. reason=${reason}, userId=${userId}`);
    return true;
  } catch (err) {
    console.error('[HUMAN] error:', err);
    return false;
  }
}
