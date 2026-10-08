
'use strict';

const fields = [
  document.getElementById('year'),
  document.getElementById('month'),
  document.getElementById('day')
];

const picker = document.getElementById('purchaseDate');
const error = document.getElementById('dateError');
const savedDate = document.getElementById('savedDate');

const lengths = [4, 2, 2];

let skipBlurValidation = false;

// 日付を YYYY-MM-DD に変換
function localDate(date) {
  return (
    String(date.getFullYear()).padStart(4, '0') + '-' +
    String(date.getMonth() + 1).padStart(2, '0') + '-' +
    String(date.getDate()).padStart(2, '0')
  );
}

const today = localDate(new Date());
picker.max = today;

// 入力値を取得
function getValues() {
  return fields.map(field => field.value);
}

// エラー表示
function setError(message) {
  error.textContent = message;
  error.hidden = !message;
}

// 正しい日付か確認
function validDate(y, m, d) {
  if (
    y < 1 || y > 9999 ||
    m < 1 || m > 12 ||
    d < 1 || d > 31
  ) {
    return false;
  }

  const date = new Date(0);
  date.setFullYear(y, m - 1, d);

  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  );
}

// カレンダーの値を同期
function syncPicker(date) {
  if (picker.value !== date) {
    picker.value = date;
  }
}

// 日付チェック
function updateValidity(showIncomplete = false) {

  const values = getValues();

  savedDate.textContent = '';

  // 全部未入力
  if (values.every(v => v === '')) {
    syncPicker('');
    setError('');
    return;
  }

  // 年4桁、月日1〜2桁がそろうまで待つ
  const complete =
    values[0].length === 4 &&
    values[1].length >= 1 &&
    values[2].length >= 1;

  if (!complete) {
    syncPicker('');

    setError(
      showIncomplete
        ? '正しい日付を入力してください。'
        : ''
    );

    return;
  }

  const y = Number(values[0]);
  const m = Number(values[1]);
  const d = Number(values[2]);

  // 日付の妥当性
  if (!validDate(y, m, d)) {
    syncPicker('');
    setError('正しい日付を入力してください。');
    return;
  }

  const date =
    String(y).padStart(4, '0') + '-' +
    String(m).padStart(2, '0') + '-' +
    String(d).padStart(2, '0');

  syncPicker(date);

  // 今日より未来
  if (date > today) {
    setError('指定された日付は選択できません。');
    return;
  }

  // 2年前の日付
  const prior = new Date();
  prior.setFullYear(prior.getFullYear() - 2);

  if (date < localDate(prior)) {
    setError(
      '恐れ入りますが、お買い上げ日から2年間より長く経過している場合、本プログラムにはご入会いただけません。'
    );
    return;
  }

  setError('');
  savedDate.textContent = `入力日付：${date}`;
}

// 全項目に日付を設定
function setDateParts(y, m, d) {
  fields[0].value = String(y).padStart(4, '0');
  fields[1].value = String(m).padStart(2, '0');
  fields[2].value = String(d).padStart(2, '0');

  updateValidity();
}

// 入力内容の数字だけを残す
function cleanInput(field, maxLength) {

  const before = field.value;

  const cursor = field.selectionStart ?? before.length;

  const cleaned = before
    .replace(/\D/g, '')
    .slice(0, maxLength);

  const newCursor = before
    .slice(0, cursor)
    .replace(/\D/g, '')
    .slice(0, maxLength)
    .length;

  if (before !== cleaned) {
    field.value = cleaned;

    try {
      field.setSelectionRange(newCursor, newCursor);
    } catch (e) {
      // カーソル制御非対応の場合は何もしない
    }
  }
}


// 年月日の入力処理
fields.forEach((field, i) => {

  // ========================================
  // カーソルを右端に移動する
  // ========================================
  function moveCursorToEnd() {
    const length = field.value.length;

    try {
      field.setSelectionRange(length, length);
    } catch (e) {
      // カーソル制御非対応の場合は何もしない
    }
  }

  // PCでクリックした場合
  field.addEventListener('click', moveCursorToEnd);

  // スマホでタップした場合
  field.addEventListener('focus', () => {
    requestAnimationFrame(moveCursorToEnd);
  });

  // ========================================
  // 数字入力処理
  // ========================================
  field.addEventListener('input', event => {

    // 数字以外を除去する
    cleanInput(field, lengths[i]);

    // 年4桁で月へ、月2桁で日へ自動移動
    const isInsert =
      event.inputType?.startsWith('insert') ?? false;

    if (
      isInsert &&
      field.value.length === lengths[i] &&
      i < 2
    ) {
      fields[i + 1].focus();
    }

    // 日付チェック
    updateValidity();
  });

  // ========================================
  // キーボード操作
  // ========================================
  field.addEventListener('keydown', event => {

    // 右矢印キーで次の項目へ移動
    if (event.key === 'ArrowRight' && i < 2) {

      if (
        field.selectionStart === field.value.length
      ) {
        event.preventDefault();
        fields[i + 1].focus();
      }
    }

    // 左矢印キーで前の項目へ移動
    if (event.key === 'ArrowLeft' && i > 0) {

      if (field.selectionStart === 0) {
        event.preventDefault();
        fields[i - 1].focus();
      }
    }

    // / または Enter で次の項目へ移動
    if (
      (event.key === '/' || event.key === 'Enter') &&
      i < 2
    ) {
      event.preventDefault();
      fields[i + 1].focus();
    }
  });

  // ========================================
  // 貼り付け処理
  // ========================================
  field.addEventListener('paste', event => {

    const text =
      event.clipboardData?.getData('text') || '';

    // YYYY/MM/DD または YYYY-MM-DD
    const match = text.trim().match(
      /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/
    );

    const digits = text.replace(/\D/g, '');

    // 日付をまとめて貼り付けた場合
    if (match || digits.length === 8) {

      event.preventDefault();

      let y, m, d;

      if (match) {

        [, y, m, d] = match;

      } else {

        y = digits.slice(0, 4);
        m = digits.slice(4, 6);
        d = digits.slice(6, 8);
      }

      // 年月日に値を設定
      setDateParts(y, m, d);

      // 日にフォーカス
      fields[2].focus();
    }
  });

  // ========================================
  // フォーカスが外れたとき
  // ========================================
  field.addEventListener('blur', () => {

    if (skipBlurValidation) return;

    // フォーカス移動の完了後に確認
    setTimeout(() => {

      if (skipBlurValidation) return;

      const active = document.activeElement;

      // 年・月・日の入力中はエラーを確定しない
      if (
        fields.includes(active) ||
        active === picker
      ) {
        return;
      }

      // 月・日が1桁ならゼロ埋めする
      for (let j = 1; j <= 2; j++) {

        const value = fields[j].value;

        if (value.length === 1) {
          fields[j].value = value.padStart(2, '0');
        }
      }

      // 日付チェック
      updateValidity(true);

    }, 0);
  });

});


// カレンダーから選択した場合
picker.addEventListener('change', () => {

  if (!picker.value) {
    fields.forEach(field => field.value = '');
    updateValidity();
    return;
  }

  const [y, m, d] = picker.value.split('-');

  setDateParts(y, m, d);
});

// 初期化
updateValidity();
