const HUMAN_KEYWORDS = {
  ko: ['사람', '직원', '상담원', '도움말', '연결해줘', '사람이랑 얘기'],
  en: [
    'human', 'agent', 'staff', 'real person',
    'help me', 'help', 'connect me', 'talk to someone',
    'speak to someone', 'i need help', 'need help',
    'speak someone', 'need to speak',
  ],
  id: ['manusia', 'petugas', 'staf', 'bantuan langsung', 'bantuan', 'tolong', 'minta bantuan'],
};
const FAIL_THRESHOLD = 3;

export function isHumanRequest(text = '') {
  const t = text.toLowerCase();
  return Object.values(HUMAN_KEYWORDS).flat().some(k => t.includes(k.toLowerCase()));
}

export function incrementFailCount(session) {
  session.failCount = (session.failCount || 0) + 1;
  return session.failCount;
}

export function resetFailCount(session) {
  session.failCount = 0;
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
    keyword: '사용자 직접 요청',
    ai_fail: 'AI 해결 불가 감지',
    threshold: `대화 실패 ${FAIL_THRESHOLD}회 초과`,
  }[reason] || reason;

  const message = [
    `🔔 도우미 호출`,
    `📌 사유: ${reasonLabel}`,
    `🌐 언어: ${lang}`,
    `👤 사용자 ID: ${userId}`,
    `💬 마지막 메시지: ${userMessage}`,
    `🕐 시각: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`,
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

    console.log(`[HUMAN] Notified helper via LINE. reason=${reason}, userId=${userId}`);
    return true;
  } catch (err) {
    console.error('[HUMAN] notifyHumanViaLine error:', err);
    return false;
  }
}

export function humanRequestReply(lang, reason) {
  const link = process.env.HELPER_LINE_LINK || 'https://line.me/ti/p/virtualbutler';
  const isAuto = reason === 'threshold' || reason === 'ai_fail';

  const msgs = {
    en: isAuto
      ? `🙏 It seems I'm having trouble helping you.\n\n👤 Please contact our human assistant directly via LINE:\n${link}`
      : `👤 Sure! Please contact our human assistant directly via LINE:\n${link}`,
    vi: isAuto
      ? `🙏 Có vẻ tôi gặp khó khăn trong việc hỗ trợ bạn.\n\n👤 Vui lòng liên hệ trực tiếp với nhân viên hỗ trợ qua LINE:\n${link}`
      : `👤 Được! Vui lòng liên hệ trực tiếp với nhân viên hỗ trợ qua LINE:\n${link}`,
    id: isAuto
      ? `🙏 Sepertinya saya kesulitan membantu Anda.\n\n👤 Silakan hubungi asisten kami langsung via LINE:\n${link}`
      : `👤 Tentu! Silakan hubungi asisten kami langsung via LINE:\n${link}`,
    mn: isAuto
      ? `🙏 Таньд тусалахад бэрхшээл гарч байна.\n\n👤 Манай туслахтай LINE-ээр шууд холбогдоно уу:\n${link}`
      : `👤 Мэдээж! Манай туслахтай LINE-ээр шууд холбогдоно уу:\n${link}`,
  };

  return msgs[lang] || msgs.en;
}
