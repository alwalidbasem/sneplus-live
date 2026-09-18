/* Waitlist form, translated from /i18n/{lang}.json */
let wlSelectedType = null;
let wlSubmitting = false;

function waitlistCopy() {
  return App.t('waitlist.form', {});
}

function setWaitlistLang() {
  const c = waitlistCopy();
  const isAr = App.lang === 'ar';
  $('#wlForm').attr('dir', isAr ? 'rtl' : 'ltr').toggleClass('ar-font', isAr);
  $('#wlHeadline').text(c.headline);
  $('#wlDesc').text(c.description);
  $('#lblName').text(c.name);
  $('#lblEmail').text(c.email);
  $('#lblCountry').text(c.country);
  $('#lblType').text(c.type);
  $('#lblCategory').text(c.category);
  $('#wlSubmitBtn').text(c.submit);
  $('#wlResetBtn').text(c.backToForm);
  $('#wlLangEnBtn').text(App.t('common.language.english')).toggleClass('bg-hype', App.lang === 'en');
  $('#wlLangArBtn').text(App.t('common.language.arabic')).toggleClass('bg-hype', App.lang === 'ar');

  const $group = $('#wlTypeGroup').empty();
  c.types.forEach((label, i) => {
    const key = ['buyer', 'seller', 'creator'][i];
    const $btn = $('<button type="button">')
      .addClass('py-2 rounded-xl text-xs font-semibold border border-line hover:border-white/30 transition')
      .text(label)
      .on('click', () => {
        wlSelectedType = key;
        $group.children().removeClass('bg-hype border-hype');
        $btn.addClass('bg-hype border-hype');
      });
    if (wlSelectedType === key) $btn.addClass('bg-hype border-hype');
    $group.append($btn);
  });

  $('#wlCategory').html('<option value="">-</option>' + c.categories.map((cat) => `<option>${cat}</option>`).join(''));
}

function resetWaitlistForm() {
  $('#wlSuccess').addClass('hidden');
  $('#wlForm').removeClass('hidden')[0].reset();
  wlSelectedType = null;
  setWaitlistLang();
}

$(async () => {
  await App.init({ navActive: 'waitlist' });
  setWaitlistLang();

  $('#wlLangEnBtn').on('click', async () => {
    await App.setLang('en');
    setWaitlistLang();
  });
  $('#wlLangArBtn').on('click', async () => {
    await App.setLang('ar');
    setWaitlistLang();
  });
  $(document).on('sneplus:lang', setWaitlistLang);
  $('#wlResetBtn').on('click', resetWaitlistForm);

  $('#wlForm').on('submit', async (e) => {
    e.preventDefault();
    if (wlSubmitting) return;
    const c = waitlistCopy();
    const $err = $('#wlEmailError').addClass('hidden');

    if (!wlSelectedType) {
      alert(c.needType);
      return;
    }

    const payload = {
      name: $('#wlName').val().trim(),
      email: $('#wlEmail').val().trim().toLowerCase(),
      country: $('#wlCountry').val(),
      user_type: wlSelectedType,
      category: $('#wlCategory').val(),
      language: App.lang
    };

    try {
      wlSubmitting = true;
      $('#wlSubmitBtn').prop('disabled', true).text(c.joining);
      await WaitlistAPI.join(payload);
      $('#wlForm').addClass('hidden');
      $('#wlSuccessMsg').text(c.success).toggleClass('ar-font', App.lang === 'ar');
      $('#wlSuccess').removeClass('hidden');
    } catch (xhr) {
      if (API.errorCode(xhr) === 'EMAIL_EXISTS') {
        $err.text(c.duplicateEmail).removeClass('hidden');
      } else {
        $err.text(API.errorText(xhr)).removeClass('hidden');
      }
    } finally {
      wlSubmitting = false;
      $('#wlSubmitBtn').prop('disabled', false).text(c.submit);
    }
  });
});
