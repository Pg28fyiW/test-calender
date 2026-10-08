'use strict';

const text = document.getElementById('purchaseDateText');
const picker = document.getElementById('purchaseDate');
const maskTyped = document.getElementById('maskTyped');
const maskRest = document.getElementById('maskRest');
const error = document.getElementById('dateError');
const savedDate = document.getElementById('savedDate');

/** ローカル日付を YYYY-MM-DD にする（UTCにしない） */
function formatLocalDate(date) {
  const y = String(date.getFullYear()).padStart(4, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
const todayDate = formatLocalDate(new Date());
picker.max = todayDate;

/** 年0001～0099にも対応する実在日付チェック */
function isValidDate(y, m, d) {
  if (y < 1 || y > 9999 || m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(0);
  dt.setFullYear(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

/** 入力中の年月日の残りを灰色で表示 */
function maskRestText(value) {
  if (!value) return '年 / 月 / 日';
  const parts = value.split('/');
  if (parts.length === 1) return ' / 月 / 日';
  if (parts.length === 2) return parts[1].trim() ? ' / 日' : '月 / 日';
  if (parts.length === 3) return parts[2].trim() ? '' : '日';
  return '';
}

function render() {
  maskTyped.textContent = text.value;
  maskRest.textContent = maskRestText(text.value);
}
function setError(message) {
  error.textContent = message;
  error.hidden = !message;
  text.setAttribute('aria-invalid', String(!!message));
}
function setSavedDate(value) {
  picker.value = value;
  savedDate.textContent = value ? `保存する日付：${value}` : '';
}

/** 入力欄の値を年・月・日に振り分ける */
function parseTyping(value) {
  const raw = value.replace(/[^\d/]/g, '');
  if (/^\d{8}$/.test(raw)) {
    return [raw.slice(0, 4), raw.slice(4, 6), raw.slice(6, 8)];
  }
  const parts = raw.split('/').slice(0, 3);
  parts[0] = (parts[0] || '').slice(0, 4);
  if (parts.length >= 2) parts[1] = parts[1].slice(0, 2);
  if (parts.length >= 3) parts[2] = parts[2].slice(0, 2);
  if (parts.length >= 2 && parts[0]) parts[0] = parts[0].padStart(4, '0');
  if (parts.length >= 3 && parts[1]) parts[1] = parts[1].padStart(2, '0');
  if (parts.length === 1 && parts[0].length === 4) parts.push('');
  if (parts.length === 2 && parts[1].length === 2) parts.push('');
  return parts;
}

/** 有効な日付のみ保存。日付超過などはメッセージ表示 */
function validateAndSave(parts) {
  const [y, m, d] = parts.map(Number);
  if (!isValidDate(y, m, d)) {
    setSavedDate('');
    setError('正しい日付を入力してください。');
    return;
  }
  const value = `${parts[0]}-${parts[1]}-${parts[2]}`;
  setSavedDate(value);
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  if (value < formatLocalDate(twoYearsAgo)) {
    setError('恐れ入りますが、お買い上げ日から2年間より長く経過している場合、本プログラムにはご入会いただけません。');
  } else if (value > todayDate) {
    setError('指定された日付は選択できません。');
  } else {
    setError('');
  }
}

text.addEventListener('input', (event) => {
  let parts = parseTyping(text.value);
  // 区切り記号や空白をBackspaceで削除したときに入力が止まらないようにする
  if (event.inputType === 'deleteContentBackward' &&
      parts.join(' / ') === previousDisplay && previousDisplay) {
    const digits = previousDisplay.replace(/\D/g, '').slice(0, -1);
    parts = parseTyping(digits);
  }
  text.value = parts.join(' / ');
  previousDisplay = text.value;
  text.setSelectionRange(text.value.length, text.value.length);
  render();
  setSavedDate('');
  setError('');
  if (parts.length === 3 && parts[0].length === 4 &&
      parts[1].length === 2 && parts[2].length === 2) {
    validateAndSave(parts);
  }
});

text.addEventListener('blur', () => {
  if (!text.value.trim()) {
    setSavedDate('');
    setError('');
    return;
  }
  const parts = text.value.split('/').map(v => v.trim());
  if (parts[0]) parts[0] = parts[0].padStart(4, '0');
  if (parts.length >= 2 && parts[1]) parts[1] = parts[1].padStart(2, '0');
  if (parts.length >= 3 && parts[2]) parts[2] = parts[2].padStart(2, '0');
  text.value = parts.join(' / ');
  previousDisplay = text.value;
  render();
  if (parts.length === 3 && parts[0].length === 4 &&
      parts[1].length === 2 && parts[2].length === 2) {
    validateAndSave(parts);
  } else {
    setSavedDate('');
    setError('正しい日付を入力してください。');
  }
});

picker.addEventListener('change', () => {
  const value = picker.value;
  text.value = value ? value.replace(/-/g, ' / ') : '';
  previousDisplay = text.value;
  render();
  if (value) {
    validateAndSave(value.split('-'));
  } else {
    setSavedDate('');
    setError('');
  }
});

let previousDisplay = '';
render();
