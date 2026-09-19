/* Waitlist form, translated from /i18n/{lang}.json */
let wlSubmitting = false;

/* Selection state for the custom dropdown menus (keyed by prefix) */
const wlDD = { wlType: null, wlCountry: null, wlCategory: null };
let wlOpenMenu = null;

const COUNTRY_OPTIONS = ['Jordan', 'Saudi Arabia', 'United Arab Emirates', 'Egypt', 'Kuwait', 'Qatar', 'Other'];
const TYPE_KEYS = ['buyer', 'seller', 'creator'];

function waitlistCopy() {
  return App.t('waitlist.form', {});
}

function wlCloseAllMenus() {
  $('.wl-dd-menu').addClass('hidden');
  $('.wl-dd-btn').attr('aria-expanded', 'false');
  wlOpenMenu = null;
}

/* Generic dropdown menu builder: prefix is wlType / wlCountry / wlCategory */
function wlBuildMenu(prefix, options) {
  const selected = wlDD[prefix];
  const $menu = $('#' + prefix + 'Menu').empty();
  options.forEach((opt) => {
    const $item = $('<button type="button" role="option">')
      .addClass('w-full text-left px-3.5 py-2.5 text-sm hover:bg-white/10 transition')
      .text(opt.label)
      .on('click', () => {
        wlDD[prefix] = opt.value;
        $('#' + prefix + 'Input').val(opt.value);
        $('#' + prefix + 'Label').text(opt.label).removeClass('text-muted');
        $menu.children().removeClass('bg-hype/20 text-white');
        $item.addClass('bg-hype/20 text-white');
        wlCloseAllMenus();
      });
    if (selected === opt.value) {
      $item.addClass('bg-hype/20 text-white');
      $('#' + prefix + 'Label').text(opt.label).removeClass('text-muted');
    }
    $menu.append($item);
  });
  if (!selected) {
    $('#' + prefix + 'Label').text('-').addClass('text-muted');
    $('#' + prefix + 'Input').val('');
  }
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

  wlBuildMenu('wlType', c.types.map((label, i) => ({ value: TYPE_KEYS[i], label })));
  wlBuildMenu('wlCountry', COUNTRY_OPTIONS.map((v) => ({ value: v, label: v })));
  wlBuildMenu('wlCategory', (c.categories || []).map((cat) => ({ value: cat, label: cat })));
}

function resetWaitlistForm() {
  $('#wlSuccess').addClass('hidden');
  $('#wlForm').removeClass('hidden')[0].reset();
  wlDD.wlType = null;
  wlDD.wlCountry = null;
  wlDD.wlCategory = null;
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
    if (!wlDD.wlType) {
      alert(c.needType);
      return;
    }

    const payload = {
      name: $('#wlName').val().trim(),
      email: $('#wlEmail').val().trim().toLowerCase(),
      country: wlDD.wlCountry || '',
      user_type: wlDD.wlType,
      category: wlDD.wlCategory || '',
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

/* Generic custom dropdown menu behavior */
$(document).on('click', '.wl-dd-btn', function () {
  const prefix = $(this).data('dd');
  const opening = wlOpenMenu !== prefix;
  wlCloseAllMenus();
  if (opening) {
    wlOpenMenu = prefix;
    $('#' + prefix + 'Menu').removeClass('hidden');
    $(this).attr('aria-expanded', 'true');
  }
});

$(document).on('click', (e) => {
  if (wlOpenMenu && !$(e.target).closest('.wl-dd').length) wlCloseAllMenus();
});

$(document).on('keydown', (e) => {
  if (e.key === 'Escape') wlCloseAllMenus();
});