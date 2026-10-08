'use strict';

const fields = [document.getElementById('year'), document.getElementById('month'), document.getElementById('day')];
const picker = document.getElementById('purchaseDate');
const error = document.getElementById('dateError');
const savedDate = document.getElementById('savedDate');
const lengths = [4, 2, 2];
// Input表示値から逆算せず、実際にタイプされた数字だけを保持する。
const raw = ['', '', ''];

function localDate(date) {
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
const today = localDate(new Date());
picker.max = today;

function validDate(y, m, d) {
  if (y < 1 || y > 9999 || m < 1 || m > 12 || d < 1 || d > 31) return false;
  const value = new Date(0);
  value.setFullYear(y, m - 1, d);
  return value.getFullYear() === y && value.getMonth() === m - 1 && value.getDate() === d;
}
function setError(message) {
  error.textContent = message;
  error.hidden = !message;
}
function updateValidity(showIncomplete = false) {
  savedDate.textContent = '';
  if (raw.every(v => !v)) { picker.value = ''; setError(''); return; }
  if (!raw.every(v => v !== '')) {
    picker.value = '';
    setError(showIncomplete ? '正しい日付を入力してください。' : '');
    return;
  }
  const [y, m, d] = raw.map(Number);
  if (!validDate(y, m, d)) { picker.value = ''; setError('正しい日付を入力してください。'); return; }
  const date = `${raw[0].padStart(4, '0')}-${raw[1].padStart(2, '0')}-${raw[2].padStart(2, '0')}`;
  picker.value = date;
  savedDate.textContent = `入力日付：${date}`;
  const prior = new Date();
  prior.setFullYear(prior.getFullYear() - 2);
  if (date > today) setError('指定された日付は選択できません。');
  else if (date < localDate(prior)) setError('恐れ入りますが、お買い上げ日から2年間より長く経過している場合、本プログラムにはご入会いただけません。');
  else setError('');
}
function paint(i) {
  fields[i].value = raw[i] ? raw[i].padStart(lengths[i], '0') : '';
}
function paintAll() { fields.forEach((_, i) => paint(i)); }

// 年・月・日をタップしたら、その項目だけを編集する。
// 入力時はrawに追記する。補完された0を入力データとして扱わない。
function enter(i, text) {
  for (const digit of text.replace(/\D/g, '')) {
    if (raw[i].length < lengths[i]) raw[i] += digit;
  }
  paint(i);
  updateValidity();
  if (raw[i].length === lengths[i] && i < 2) fields[i + 1].focus();
}
function erase(i) {
  raw[i] = raw[i].slice(0, -1);
  paint(i);
  updateValidity();
}

fields.forEach((field, i) => {
  // 部分値がすでにある場合は選択・編集しやすいようにフォーカス時に全選択。
  field.addEventListener('focus', () => field.select());

  field.addEventListener('beforeinput', event => {
    if (!event.cancelable || event.isComposing) return;
    if (event.inputType === 'insertText' && event.data) {
      event.preventDefault();
      // 選択中の入力項目に新規入力した場合は、その項目を置換する。
      if (field.selectionStart === 0 && field.selectionEnd === field.value.length && field.value) raw[i] = '';
      enter(i, event.data);
    } else if (event.inputType === 'deleteContentBackward' || event.inputType === 'deleteContentForward') {
      event.preventDefault();
      if (field.selectionStart === 0 && field.selectionEnd === field.value.length && field.value) raw[i] = '';
      else raw[i] = raw[i].slice(0, -1);
      paint(i);
      updateValidity();
    }
  });

  // beforeinputをキャンセルできない環境のフォールバック。
  field.addEventListener('input', event => {
    const fallback = field.value;
    if (event.inputType?.startsWith('delete')) {
      erase(i);
    } else if (event.data && event.inputType?.startsWith('insert')) {
      enter(i, event.data);
    } else {
      // オートフィルや貼り付けでの置換入力
      raw[i] = fallback.replace(/\D/g, '').slice(-lengths[i]);
      paint(i);
      updateValidity();
    }
  });
  field.addEventListener('paste', event => {
    event.preventDefault();
    const value = event.clipboardData?.getData('text') || '';
    const digits = value.replace(/\D/g, '');
    if (digits.length === 8) {
      raw[0] = digits.slice(0, 4);
      raw[1] = digits.slice(4, 6);
      raw[2] = digits.slice(6, 8);
      paintAll();
      updateValidity();
      fields[2].focus();
    } else {
      raw[i] = '';
      enter(i, digits);
    }
  });
  field.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' && i < 2) { event.preventDefault(); fields[i + 1].focus(); }
    if (event.key === 'ArrowLeft' && i > 0) { event.preventDefault(); fields[i - 1].focus(); }
    if ((event.key === '/' || event.key === 'Enter') && i < 2) { event.preventDefault(); fields[i + 1].focus(); }
  });
  field.addEventListener('blur', () => {
    // 3項目中、いずれか入力されていない場合は欄全体から出た時に通知。
    // 同一グループの次項目へ移動しているときは一時的なエラーを出さない。
    setTimeout(() => {
      if (!fields.includes(document.activeElement) && document.activeElement !== picker) updateValidity(true);
    }, 0);
  });
});

picker.addEventListener('change', () => {
  if (picker.value) {
    const p = picker.value.split('-');
    p.forEach((v, i) => { raw[i] = String(Number(v)); });
  } else raw.fill('');
  paintAll();
  updateValidity();
});
paintAll();
updateValidity();
