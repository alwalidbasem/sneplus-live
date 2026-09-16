/* Waitlist — bilingual form, posts to PostgreSQL via /api/waitlist */
const WL_COPY = {
  en: {
    dir:'ltr', font:'',
    desc:'Live Commerce is shopping and selling through live video, where customers can interact with the host, ask questions, and buy or bid directly during the live stream.',
    name:'Name', email:'Email', country:'Country', type:'User Type', category:'Preferred Category',
    types:['Buyer','Seller','Creator / Host'],
    categories:['Sneakers','Watches','Phones','Fashion','Beauty','Other'],
    cta:'Join the Waitlist',
    success:"You're on the list. We'll notify you when Sneplus Live launches.",
    dupe:'This email is already registered.',
    needType:'Please select a user type'
  },
  ar: {
    dir:'rtl', font:'ar-font',
    desc:'Live Commerce هو البيع والشراء من خلال البث المباشر، بحيث يشاهد العميل المنتج ويتفاعل مع البائع ويشتري أو يزايد مباشرة أثناء الـLive.',
    name:'الاسم', email:'البريد الإلكتروني', country:'الدولة', type:'نوع المستخدم', category:'الفئة المفضلة',
    types:['مشتري','بائع','Creator / Host'],
    categories:['Sneakers','Watches','Phones','Fashion','Beauty','Other'],
    cta:'انضم لقائمة الانتظار',
    success:'تم تسجيلك بنجاح. رح نخبرك عند إطلاق Sneplus Live.',
    dupe:'هذا البريد الإلكتروني مسجل مسبقاً.',
    needType:'الرجاء اختيار نوع المستخدم'
  }
};

let wlLang = localStorage.getItem('sneplus_lang') || 'en';
let wlSelectedType = null;

function setWaitlistLang(lang) {
  wlLang = lang;
  localStorage.setItem('sneplus_lang', lang);
  const c = WL_COPY[lang];
  $('#wlForm').attr('dir', c.dir).toggleClass('ar-font', lang === 'ar');
  $('#wlHeadline').text('SNEPLUS LIVE');
  $('#wlDesc').text(c.desc);
  $('#lblName').text(c.name);
  $('#lblEmail').text(c.email);
  $('#lblCountry').text(c.country);
  $('#lblType').text(c.type);
  $('#lblCategory').text(c.category);
  $('#wlSubmitBtn').text(c.cta);
  $('#wlLangEnBtn').toggleClass('bg-hype', lang === 'en');
  $('#wlLangArBtn').toggleClass('bg-hype', lang === 'ar');

  const $group = $('#wlTypeGroup').empty();
  c.types.forEach((label, i) => {
    const key = ['buyer','seller','creator'][i];
    const $btn = $('<button type="button">')
      .addClass('py-2 rounded-xl text-xs font-semibold border border-line hover:border-white/30 transition')
      .text(label)
      .on('click', () => {
        wlSelectedType = key;
        $group.children().removeClass('bg-hype border-hype');
        $btn.addClass('bg-hype border-hype');
      });
    $group.append($btn);
  });

  $('#wlCategory').html('<option value="">—</option>' + c.categories.map(cat => `<option>${cat}</option>`).join(''));
}

function resetWaitlistForm() {
  $('#wlSuccess').addClass('hidden');
  $('#wlForm').removeClass('hidden')[0].reset();
  wlSelectedType = null;
  setWaitlistLang(wlLang);
}

$(async () => {
  await App.init({ navActive: 'waitlist' });
  setWaitlistLang(wlLang);

  $('#wlLangEnBtn').on('click', () => setWaitlistLang('en'));
  $('#wlLangArBtn').on('click', () => setWaitlistLang('ar'));
  $('#wlResetBtn').on('click', resetWaitlistForm);

  $('#wlForm').on('submit', async (e) => {
    e.preventDefault();
    const c = WL_COPY[wlLang];
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
      language: wlLang
    };

    try {
      await WaitlistAPI.join(payload);
      $('#wlForm').addClass('hidden');
      $('#wlSuccessMsg').text(c.success).toggleClass('ar-font', wlLang === 'ar');
      $('#wlSuccess').removeClass('hidden');
    } catch (xhr) {
      if (API.errorCode(xhr) === 'EMAIL_EXISTS') {
        $err.text(c.dupe).removeClass('hidden');
      } else {
        $err.text(API.errorText(xhr)).removeClass('hidden');
      }
    }
  });
});
