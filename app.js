let quizQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let isAnswered = false; 

let correctCount = 0;
let wrongCount = 0;
let wrongQuestionsList = []; 
let currentCategoryFile = 'ABC.txt';
let currentMode = 'quiz'; 
let hasSkipped = false; 

// 🔑 ตัวแปรเก็บสถานะปลดล็อกชั่วคราว
let teacherTempUnlocked = false;

// 🤖 ตั้งค่า Telegram API และ Chat ID
const TELEGRAM_BOT_TOKEN = '8235688305:AAGUwsZaWzJJn7keTauBLpbUcUYP5eRuv_A';
const TELEGRAM_CHAT_ID = '-5193551029';

// 💾 โหลดข้อมูลส่วนตัว, ล็อกฟอร์มถ้าเคยกรอกแล้ว และนับจำนวนครั้งที่เข้าใช้งาน
window.addEventListener('DOMContentLoaded', () => {
    const savedName = localStorage.getItem('lao_quiz_student_name');
    const savedAge = localStorage.getItem('lao_quiz_student_age');
    const savedPhone = localStorage.getItem('lao_quiz_student_phone');

    const nameInput = document.getElementById('studentName');
    const ageInput = document.getElementById('studentAge');
    const phoneInput = document.getElementById('studentPhone');
    const homeSelect = document.getElementById('homeCategory');

    if (savedName && nameInput) {
        nameInput.value = savedName;
        nameInput.disabled = true;
        nameInput.style.backgroundColor = '#334155';
    }
    if (savedAge && ageInput) {
        ageInput.value = savedAge;
        ageInput.disabled = true;
        ageInput.style.backgroundColor = '#334155';
    }
    if (savedPhone && phoneInput) {
        phoneInput.value = savedPhone;
        phoneInput.disabled = true;
        phoneInput.style.backgroundColor = '#334155';
    }

    const savedCategory = localStorage.getItem('lao_quiz_selected_category');
    if (savedCategory && homeSelect) {
        homeSelect.value = savedCategory;
        homeSelect.disabled = true;
        homeSelect.style.backgroundColor = '#334155';
        currentCategoryFile = savedCategory;
    }

    let visitCount = parseInt(localStorage.getItem('lao_quiz_visit_count')) || 0;
    visitCount++;
    localStorage.setItem('lao_quiz_visit_count', visitCount);

    const visitBadge = document.getElementById('login-count-badge');
    const visitNum = document.getElementById('visit-count-num');
    if (visitBadge && visitNum) {
        visitNum.innerText = visitCount;
        visitBadge.style.display = 'block';
    }

    checkHomeUnlockStatus();
    window.addEventListener('online', processOfflineQueue);
    processOfflineQueue();
});

function sendLoginNotificationToTelegram() {
    const name = localStorage.getItem('lao_quiz_student_name');
    const age = localStorage.getItem('lao_quiz_student_age');
    const phone = localStorage.getItem('lao_quiz_student_phone');
    const visitCount = localStorage.getItem('lao_quiz_visit_count') || '1';

    if (!name || !phone) return;

    const homeSelect = document.getElementById('homeCategory');
    const selectedCategory = homeSelect ? homeSelect.value : currentCategoryFile;
    const licenseType = selectedCategory ? selectedCategory.replace('.txt', '') : 'ບໍ່ໄດ້ລະບຸ';

    const loginTime = new Date().toLocaleString('lo-LA', { 
        timeZone: 'Asia/Vientiane',
        dateStyle: 'short', 
        timeStyle: 'medium' 
    });

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const mapsLink = `https://www.google.com/maps?q=${lat},${lon}`;

                const message = `🔔 📚 **ນັກຮຽນເຂົ້າສູ່ລະບົບແລ້ວ (ຄັ້ງທີ ${visitCount})** 📚 🔔\n` +
                                `👤 ຊື່: ${name} (ອາຍຸ: ${age || '-'} ປີ)\n` +
                                `📞 ເບີໂທ: ${phone}\n` +
                                `🚗 ປະເພດໃບຂັບຂີ່: ${licenseType}\n` +
                                `⏰ ເວລາ: ${loginTime}\n` +
                                `📍 ຕຳແໜ່ງ GPS: [ຄລິກເບິ່ງແຜນທີ່](${mapsLink})\n` +
                                `📌 ສະຖານະ: ເປີດໜ້າເວັບເຂົ້າສູ່ລະບົບ ✅`;
                sendToTelegramAPI(message);
            },
            (error) => {
                const message = `🔔 📚 **ນັກຮຽນເຂົ້າສູ່ລະບົບແລ້ວ (ຄັ້ງທີ ${visitCount})** 📚 🔔\n` +
                                `👤 ຊື່: ${name} (ອາຍຸ: ${age || '-'} ປີ)\n` +
                                `📞 ເບີໂທ: ${phone}\n` +
                                `🚗 ປະເພດໃບຂັບຂີ່: ${licenseType}\n` +
                                `⏰ ເວລາ: ${loginTime}\n` +
                                `📍 ຕຳແໜ່ງ GPS: ⚠️ ປະຕິເສດການແບ່ງປັນຕຳແໜ່ງ\n` +
                                `📌 ສະຖານະ: ເປີດໜ້າເວັບເຂົ້າສູ່ລະບົບ ✅`;
                sendToTelegramAPI(message);
            },
            { enableHighAccuracy: true }
        );
    } else {
        const message = `🔔 📚 **ນັກຮຽນເຂົ້າສູ່ລະບົບແລ້ວ (ຄັ້ງທີ ${visitCount})** 📚 🔔\n` +
                        `👤 ຊື່: ${name} (ອາຍຸ: ${age || '-'} ປີ)\n` +
                        `📞 ເບີໂທ: ${phone}\n` +
                        `🚗 ປະເພດໃບຂັບຂີ່: ${licenseType}\n` +
                        `⏰ ເວລາ: ${loginTime}\n` +
                        `📍 ຕຳແໜ່ງ GPS: ⚠️ ເບຣົາເຊີບໍ່ຮອງຮັບ Geolocation\n` +
                        `📌 ສະຖານະ: ເປີດໜ້າເວັບເຂົ້າສູ່ລະບົບ ✅`;
        sendToTelegramAPI(message);
    }
}

function sendClassStartingNotification(modeName) {
    const name = localStorage.getItem('lao_quiz_student_name');
    const age = localStorage.getItem('lao_quiz_student_age');
    const phone = localStorage.getItem('lao_quiz_student_phone');
    const licenseType = currentCategoryFile.replace('.txt', '');

    const message = `📖 🚀 **ນັກຮຽນກຳລັງເລີ່ມເຂົ້າຮຽນແລ້ວ** 🚀 📖\n` +
                    `👤 ຊື່: ${name} (ອາຍຸ: ${age} ປີ)\n` +
                    `📞 ເບີໂທ: ${phone}\n` +
                    `🚗 ປະເພດໃບຂັບຂີ່: ${licenseType}\n` +
                    `📌 ກຳລັງເຂົ້າຮຽນໃນ: **${modeName}** (ເລີ່ມຕົ້ນທີ່ຂໍ້ທີ 1) ✅`;

    sendToTelegramAPI(message);
}

function validateAndStartApp(mode) {
    const nameInput = document.getElementById('studentName');
    const ageInput = document.getElementById('studentAge');
    const phoneInput = document.getElementById('studentPhone');
    const homeSelect = document.getElementById('homeCategory');

    const name = nameInput ? nameInput.value.trim() : (localStorage.getItem('lao_quiz_student_name') || '');
    const age = ageInput ? ageInput.value.trim() : (localStorage.getItem('lao_quiz_student_age') || '');
    const phone = phoneInput ? phoneInput.value.trim() : (localStorage.getItem('lao_quiz_student_phone') || '');

    if (!name || !age || !phone) {
        alert('⚠️ ຖ້າກະລຸນາ ໃສ່ຊື່, ອາຍຸ ແລະ ເບີໂທລະສັບ ໃຫ້ຄົບຖ້ວນກ່ອນເລີ່ມຕົ້ນ!');
        if (nameInput) nameInput.focus();
        return;
    }

    if (homeSelect && !homeSelect.value) {
        alert('⚠️ ກະລຸນາເລືອກປະເພດໃບຂັບຂີ່ກ່ອນເລີ່ມຕົ້ນ!');
        homeSelect.focus();
        return;
    }

    const filename = homeSelect ? homeSelect.value : currentCategoryFile;
    const isStudyPassed = (localStorage.getItem(`lao_quiz_study_passed_${filename}`) === 'true') || teacherTempUnlocked || (localStorage.getItem(`lao_quiz_teacher_secret_${filename}`) === 'true');
    const isQuizPassed = (localStorage.getItem(`lao_quiz_quiz_passed_${filename}`) === 'true') || teacherTempUnlocked || (localStorage.getItem(`lao_quiz_teacher_secret_${filename}`) === 'true');

    if (mode === 'quiz' || mode === 'review_wrong') {
        if (!isStudyPassed) {
            alert('⚠️ ຍັງບໍ່ສາມາດເຂົ້າໃຊ້ງານໄດ້!\nກະລຸນາອ່ານໂໝດອ່ານຮຽນຮູ້ (ໝວດ 1) ໃຫ້ຈົບທຸກຂໍ້ກ່ອນ.');
            return;
        }
    }

    if (mode === 'random') {
        if (!isQuizPassed) {
            alert('⚠️ ຍັງບໍ່ສາມາດເຂົ້າໃຊ້ງານໄດ້!\nກະລຸນາອ່ານແບບທົດສອບ (ໝວດ 2) ໃຫ້ຈົບທຸກຂໍ້ກ່ອນ');
            return;
        }
    }

    localStorage.setItem('lao_quiz_student_name', name);
    localStorage.setItem('lao_quiz_student_age', age);
    localStorage.setItem('lao_quiz_student_phone', phone);

    if (homeSelect) {
        currentCategoryFile = homeSelect.value;
        localStorage.setItem('lao_quiz_selected_category', currentCategoryFile);
    }

    if (nameInput) nameInput.disabled = true;
    if (ageInput) ageInput.disabled = true;
    if (phoneInput) phoneInput.disabled = true;
    if (homeSelect) homeSelect.disabled = true;

    let modeText = '';
    if (mode === 'study') modeText = '📖 ໝວດ 1 (ໂໝດອ່ານຮຽນຮູ້)';
    else if (mode === 'quiz') modeText = '📝 ໝວດ 2 (ໂໝດແບບທົດສອບ)';
    else if (mode === 'random') modeText = '🔀 ໝວດ 3 (ໂໝດສະຫຼັບຄຳຖາມ)';
    else if (mode === 'review_wrong') modeText = '🎯 ໝວດ 4 (ໂໝດແກ້ໄຂຂໍ້ຜິດ)';

    sendClassStartingNotification(modeText);
    startApp(mode);
}

function sendToTelegramAPI(message) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const payload = {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
    };

    if (!navigator.onLine) {
        saveToOfflineQueue(payload);
        return;
    }

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).catch(() => {
        saveToOfflineQueue(payload);
    });
}

function sendResultsToTelegram(statusText) {
    const name = localStorage.getItem('lao_quiz_student_name') || 'ບໍ່ລະບຸຊື່';
    const age = localStorage.getItem('lao_quiz_student_age') || '-';
    const phone = localStorage.getItem('lao_quiz_student_phone') || '-';
    
    const licenseType = currentCategoryFile.replace('.txt', '');
    const totalRounds = getCompletedRounds(currentMode, currentCategoryFile);
    const passedRounds = getPassedRounds(currentCategoryFile);
    
    let modeName = '';
    if (currentMode === 'study') modeName = '📖 1. ໂໝດອ່ານຮຽນຮູ້';
    else if (currentMode === 'quiz') modeName = '📝 2. ໂໝດແບບທົດສອບ';
    else if (currentMode === 'random') modeName = '🔀 3. ໂໝດສະຫຼັບຄຳຖາມ';
    else if (currentMode === 'review_wrong') modeName = '🎯 4. ໂໝດແກ້ໄຂຂໍ້ຜິດ';

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const mapsLink = `https://www.google.com/maps?q=${lat},${lon}`;

                const message = `📊 📉 **ລາຍງານຜົນການຮຽນ/ສອບເສັງ** 📉 📊\n` +
                                `👤 ຊື່: ${name} (ອາຍຸ: ${age} ປີ)\n` +
                                `📞 ເບີໂທ: ${phone}\n` +
                                `🚗 ປະເພດໃບຂັບຂີ່: ${licenseType}\n` +
                                `📌 ໝວດທີ່ເຮັດ: ${modeName}\n` +
                                `📍 ຕຳແໜ່ງ GPS: [ຄລິກເບິ່ງແຜນທີ່ສົ່ງຜົນ](${mapsLink})\n` +
                                `----------------------------------\n` +
                                `✅ ຕອບຖືກ: ${correctCount} ຂໍ້\n` +
                                `❌ ຕອບຜິດ: ${wrongCount} ຂໍ້\n` +
                                `🏆 ສອບຜ່ານແລ້ວ: ${passedRounds} ຮອບ\n` +
                                `🔄 ເຮັດຈົບລວມ: ${totalRounds} ຮອບ\n` +
                                `📌 ສະຖານະ: ${statusText}`;
                sendToTelegramAPI(message);
            },
            (error) => {
                const message = `📊 📉 **ລາຍງານຜົນການຮຽນ/ສອບເສັງ** 📉 📊\n` +
                                `👤 ຊື່: ${name} (ອາຍຸ: ${age} ປີ)\n` +
                                `📞 ເບີໂທ: ${phone}\n` +
                                `🚗 ປະເພດໃບຂັບຂີ່: ${licenseType}\n` +
                                `📌 ໝວດທີ່ເຮັດ: ${modeName}\n` +
                                `📍 ຕຳແໜ່ງ GPS: ⚠️ ປະຕິເສດການແບ່ງປັນຕຳແໜ່ງ\n` +
                                `----------------------------------\n` +
                                `✅ ຕອບຖືກ: ${correctCount} ຂໍ້\n` +
                                `❌ ຕອບຜິດ: ${wrongCount} ຂໍ້\n` +
                                `🏆 ສອບຜ່ານແລ້ວ: ${passedRounds} ຮອບ\n` +
                                `🔄 ເຮັດຈົບລວມ: ${totalRounds} ຮອບ\n` +
                                `📌 ສະຖານະ: ${statusText}`;
                sendToTelegramAPI(message);
            },
            { enableHighAccuracy: true }
        );
    } else {
        const message = `📊 📉 **ລາຍງານຜົນການຮຽນ/ສອບເສັງ** 📉 📊\n` +
                        `👤 ຊື່: ${name} (ອາຍຸ: ${age} ປີ)\n` +
                        `📞 ເບີໂທ: ${phone}\n` +
                        `🚗 ປະເພດໃບຂັບຂີ່: ${licenseType}\n` +
                        `📌 ໝວດທີ່ເຮັດ: ${modeName}\n` +
                        `📍 ຕຳແໜ່ງ GPS: ⚠️ ເບຣົາເຊີບໍ່ຮອງຮັບ Geolocation\n` +
                        `----------------------------------\n` +
                        `✅ ຕອບຖືກ: ${correctCount} ຂໍ້\n` +
                        `❌ ຕອບຜິດ: ${wrongCount} ຂໍ້\n` +
                        `🏆 ສອບຜ່ານແລ້ວ: ${passedRounds} ຮອບ\n` +
                        `🔄 ເຮັດຈົບລວມ: ${totalRounds} ຮອບ\n` +
                        `📌 ສະຖານະ: ${statusText}`;
        sendToTelegramAPI(message);
    }
}

function saveToOfflineQueue(payload) {
    let queue = JSON.parse(localStorage.getItem('lao_quiz_offline_queue')) || [];
    queue.push(payload);
    localStorage.setItem('lao_quiz_offline_queue', JSON.stringify(queue));
}

function processOfflineQueue() {
    if (!navigator.onLine) return;
    let queue = JSON.parse(localStorage.getItem('lao_quiz_offline_queue')) || [];
    if (queue.length === 0) return;

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const payload = queue.shift();
    localStorage.setItem('lao_quiz_offline_queue', JSON.stringify(queue));

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(() => {
        processOfflineQueue();
    })
    .catch(() => {
        queue.unshift(payload);
        localStorage.setItem('lao_quiz_offline_queue', JSON.stringify(queue));
    });
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function teacherUnlock() {
    const password = prompt("🔐 ໂໝດສຳລັບຄູສອນ\nກະລຸນາໃສ່ລະຫັດຜ່ານ:");
    if (password === null) return;

    const homeSelect = document.getElementById('homeCategory');
    const filename = homeSelect ? homeSelect.value : 'ABC.txt';

    if (password === "1234") {
        teacherTempUnlocked = true;
        localStorage.removeItem(`lao_quiz_study_passed_${filename}`);
        localStorage.removeItem(`lao_quiz_quiz_passed_${filename}`);
        localStorage.removeItem(`lao_quiz_teacher_secret_${filename}`);

        checkHomeUnlockStatus();
        updateSecretJumpButton();
        alert("🎉 ປົດລັອກແບບ **ຊົ່ວຄາວ** ສຳເລັດ!");
    } 
    else if (password === "77116687") {
        localStorage.setItem(`lao_quiz_study_passed_${filename}`, 'true');
        localStorage.setItem(`lao_quiz_quiz_passed_${filename}`, 'true');
        localStorage.setItem(`lao_quiz_teacher_secret_${filename}`, 'true');
        teacherTempUnlocked = false;

        checkHomeUnlockStatus();
        updateSecretJumpButton();
        alert("🎉 ປົດລັອກແບບ **ຖາວອນ** ສຳເລັດ!");
    } 
    else {
        alert("❌ ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ!");
    }
}

function checkHomeUnlockStatus() {
    const homeSelect = document.getElementById('homeCategory');
    if (homeSelect && !homeSelect.disabled) {
        currentCategoryFile = homeSelect.value;
        localStorage.setItem('lao_quiz_selected_category', currentCategoryFile);
    }
    const filename = currentCategoryFile;

    const btn2 = document.getElementById('btn-mode-2');
    const btn3 = document.getElementById('btn-mode-3');
    const btn4 = document.getElementById('btn-mode-4');
    const btn5 = document.getElementById('btn-category-5');

    const isStudyPassed = (localStorage.getItem(`lao_quiz_study_passed_${filename}`) === 'true') || teacherTempUnlocked || (localStorage.getItem(`lao_quiz_teacher_secret_${filename}`) === 'true');
    const isQuizPassed = (localStorage.getItem(`lao_quiz_quiz_passed_${filename}`) === 'true') || teacherTempUnlocked || (localStorage.getItem(`lao_quiz_teacher_secret_${filename}`) === 'true');

    if (btn2) {
        if (isStudyPassed) {
            btn2.style.background = '#f57f17';
            btn2.style.color = '#ffffff';
            btn2.innerHTML = '📝 2. ໂໝດແບບທົດສອບ (ຄິດຄະແນນ)';
        } else {
            btn2.style.background = '#64748b';
            btn2.style.color = '#cbd5e1';
            btn2.innerHTML = '🔒 2. ໂໝດແບບທົດສອບ (ຄິດຄະແນນ) - [ຕ້ອງອ່ານໝວດ 1 ໃຫ້ຈົບທຸກຂໍ້ກ່ອນ]';
        }
    }

    if (btn4) {
        if (isStudyPassed) {
            btn4.style.background = '#dc2626';
            btn4.style.color = '#ffffff';
            btn4.innerHTML = '🎯 4. ໂໝດແກ້ໄຂຂໍ້ຜິດ (ຄຳຖາມທີ່ເຄີຍຕອບຜິດ)';
        } else {
            btn4.style.background = '#64748b';
            btn4.style.color = '#cbd5e1';
            btn4.innerHTML = '🔒 4. ໂໝດແກ້ໄຂຂໍ້ຜິດ - [ຕ້ອງອ່ານໝວດ 1 ໃຫ້ຈົບທຸກຂໍ້ກ່ອນ]';
        }
    }

    if (btn3) {
        if (isQuizPassed) {
            btn3.style.background = '#7e22ce';
            btn3.style.color = '#ffffff';
            btn3.innerHTML = '🔀 3. ໂໝດສະຫຼັບຄຳຖາມ (Random)';
        } else {
            btn3.style.background = '#64748b';
            btn3.style.color = '#cbd5e1';
            btn3.innerHTML = '🔒 3. ໂໝດສະຫຼັບຄຳຖາມ (Random) - [ຕ້ອງເຮັດໝວດ 2 ໃຫ້ສร็จກ່ອນ]';
        }
    }

    if (btn5) {
        if (isQuizPassed) {
            btn5.style.background = '#0d9488';
            btn5.style.color = '#ffffff';
            btn5.innerHTML = '🚀 5. ໝວດທີ 5 (ສອບເສັງຈຳລອງພິເສດ)';
        } else {
            btn5.style.background = '#64748b';
            btn5.style.color = '#cbd5e1';
            btn5.innerHTML = '🔒 5. ໝວດທີ 5 (ສອບເສັງຈຳລອງພິເສດ) - [ຕ້ອງເຮັດໝວດ 2 ໃຫ້ສร็จກ່ອນ]';
        }
    }
}

function updateSecretJumpButton() {
    const filename = currentCategoryFile;
    const isUnlocked = (localStorage.getItem(`lao_quiz_teacher_secret_${filename}`) === 'true') || teacherTempUnlocked;
    let jumpBtn = document.getElementById('secret-jump-btn');
    
    if (isUnlocked) {
        if (!jumpBtn) {
            const subHeader = document.getElementById('sub-header-bar');
            if (subHeader) {
                jumpBtn = document.createElement('button');
                jumpBtn.id = 'secret-jump-btn';
                jumpBtn.innerHTML = '⚡ ໄປຂໍ້ສຸດທ້າຍ';
                jumpBtn.onclick = jumpToLastQuestion;
                jumpBtn.style.cssText = 'padding: 4px 8px; font-size: 0.75rem; font-weight: bold; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);';
                subHeader.appendChild(jumpBtn);
            }
        } else {
            jumpBtn.style.display = 'inline-block';
        }
    } else {
        if (jumpBtn) jumpBtn.style.display = 'none';
    }
}

function getCompletedRounds(mode, filename) {
    if (mode === 'study' || mode === 'review_wrong') return 0;
    const key = `lao_quiz_rounds_${mode}_${filename}`;
    return parseInt(localStorage.getItem(key)) || 0;
}

function incrementCompletedRounds(mode, filename) {
    if (mode === 'study' || mode === 'review_wrong') return;
    const key = `lao_quiz_rounds_${mode}_${filename}`;
    let rounds = parseInt(localStorage.getItem(key)) || 0;
    rounds++;
    localStorage.setItem(key, rounds);
    return rounds;
}

function getPassedRounds(filename) {
    const key = `lao_quiz_passed_${filename}`;
    return parseInt(localStorage.getItem(key)) || 0;
}

function incrementPassedRounds(filename) {
    const key = `lao_quiz_passed_${filename}`;
    let passed = parseInt(localStorage.getItem(key)) || 0;
    passed++;
    localStorage.setItem(key, passed);
    return passed;
}

function updateRoundBanner() {
    const banner = document.getElementById('round-counter-banner');
    const passedSpan = document.getElementById('passed-rounds-count');
    const countSpan = document.getElementById('completed-rounds-count');
    if (!banner || !passedSpan || !countSpan) return;

    if (currentMode === 'quiz' || currentMode === 'random') {
        banner.style.display = 'block';
        passedSpan.innerText = getPassedRounds(currentCategoryFile);
        countSpan.innerText = getCompletedRounds(currentMode, currentCategoryFile);
    } else {
        banner.style.display = 'none';
    }
}

function startApp(mode) {
    const homeSelect = document.getElementById('homeCategory');
    if (homeSelect) {
        currentCategoryFile = homeSelect.value;
        localStorage.setItem('lao_quiz_selected_category', currentCategoryFile);
    }
    const filename = currentCategoryFile;

    const isStudyPassed = (localStorage.getItem(`lao_quiz_study_passed_${filename}`) === 'true') || teacherTempUnlocked;
    const isQuizPassed = (localStorage.getItem(`lao_quiz_quiz_passed_${filename}`) === 'true') || teacherTempUnlocked;

    if (mode === 'quiz' || mode === 'review_wrong') {
        if (!isStudyPassed) {
            alert('⚠️ ຍັງບໍ່ສາມາດເຂົ້າໃຊ້ງານໄດ້!\nກະລຸນາອ່ານໂໝດຮຽນຮູ້ (ໝວດ 1) ໃຫ້ຈົບທຸກຂໍ້ກ່ອນ.');
            return;
        }
    }

    if (mode === 'random') {
        if (!isQuizPassed) {
            alert('⚠️ ຍັງບໍ່ສາມາດເຂົ້າໃຊ້ງານໄດ້!\nກະລຸນາອ່ານແບບທົດສອບ (ໝວດ 2) ໃຫ້ຈົບທຸກຂໍ້ກ່ອນ');
            return;
        }
    }

    currentMode = mode;
    hasSkipped = false; 
    
    const innerSelect = document.getElementById('licenseCategory');
    if (innerSelect) innerSelect.value = currentCategoryFile;

    const homeScreen = document.getElementById('home-screen');
    if (homeScreen) homeScreen.style.display = 'none';

    const wrapper = document.getElementById('main-quiz-wrapper');
    if (wrapper) wrapper.style.display = 'flex';

    const quizBox = document.getElementById('main-quiz-box');
    if (currentMode === 'study') {
        if (quizBox) { quizBox.style.backgroundColor = '#18181b'; quizBox.style.color = '#ffffff'; }
    } else if (currentMode === 'quiz') {
        if (quizBox) { quizBox.style.backgroundColor = '#713f12'; quizBox.style.color = '#ffffff'; }
    } else if (currentMode === 'random') {
        if (quizBox) { quizBox.style.backgroundColor = '#581c87'; quizBox.style.color = '#ffffff'; }
    } else if (currentMode === 'review_wrong') {
        if (quizBox) { quizBox.style.backgroundColor = '#ca8a04'; quizBox.style.color = '#ffffff'; }
    }

    const scoreBoard = document.getElementById('live-score-board');
    if (scoreBoard) {
        scoreBoard.style.display = (currentMode === 'study') ? 'none' : 'flex';
    }

    updateRoundBanner();
    fetchQuestions(currentCategoryFile, false);
}

function goHome() {
    const wrapper = document.getElementById('main-quiz-wrapper');
    if (wrapper) wrapper.style.display = 'none';

    const homeScreen = document.getElementById('home-screen');
    if (homeScreen) homeScreen.style.display = 'block';

    const quizBox = document.getElementById('main-quiz-box');
    if (quizBox) {
        quizBox.style.backgroundColor = '#1e3a8a'; 
        quizBox.style.color = '#ffffff';
    }
    checkHomeUnlockStatus(); 
}

async function fetchQuestions(filename, isRestoring = false) {
    currentCategoryFile = filename;
    
    const resultScreen = document.getElementById('result-screen');
    if (resultScreen) resultScreen.style.display = 'none';

    const quizScreen = document.getElementById('quiz-screen');
    if (quizScreen) quizScreen.style.display = 'flex';

    const questionText = document.getElementById('question-text');
    if (questionText) questionText.innerText = 'ກຳລັງໂຫຼດຂໍ້ສອບຈາກ ' + filename + '...';

    const optionsContainer = document.getElementById('options-container');
    if (optionsContainer) optionsContainer.innerHTML = '';

    const imgContainer = document.getElementById('image-container');
    if (imgContainer) imgContainer.innerHTML = '';
    
    try {
        if (currentMode === 'review_wrong') {
            const savedWrong = localStorage.getItem('lao_quiz_wrong_' + filename);
            quizQuestions = savedWrong ? JSON.parse(savedWrong) : [];
            currentQuestionIndex = 0;
            userAnswers = {};
            correctCount = 0;
            wrongCount = 0;
            wrongQuestionsList = [];
        } else {
            const response = await fetch(filename);
            if (!response.ok) throw new Error('ไม่พบไฟล์ ' + filename);
            const textData = await response.text();
            quizQuestions = parseCsvInsideTxt(textData);
            
            if (!isRestoring) {
                const storageKey = 'lao_quiz_state_' + currentMode + '_' + filename;
                const savedData = localStorage.getItem(storageKey);
                if (savedData) {
                    const data = JSON.parse(savedData);
                    currentQuestionIndex = data.currentQuestionIndex || 0;
                    userAnswers = data.userAnswers || {};
                    correctCount = data.correctCount || 0;
                    wrongCount = data.wrongCount || 0;
                    if (currentMode === 'random' && data.quizQuestions) {
                        quizQuestions = data.quizQuestions;
                    }
                } else {
                    currentQuestionIndex = 0;
                    userAnswers = {};
                    correctCount = 0;
                    wrongCount = 0;
                    wrongQuestionsList = [];
                    if (currentMode === 'random') shuffleArray(quizQuestions);
                }
            } else {
                if (currentMode === 'random') shuffleArray(quizQuestions);
            }
        }
        
        isAnswered = (currentMode === 'study') ? true : (userAnswers[currentQuestionIndex] !== undefined);
        updateLiveScore();
        updateRoundBanner();
        updateSecretJumpButton();
        
        if (quizQuestions.length > 0) {
            loadQuestion();
        } else {
            if (currentMode === 'review_wrong') {
                showReviewWrongCompleteScreen(); 
            } else {
                if (questionText) questionText.innerText = 'ບໍ່ມີຂໍ້ສອບ';
            }
            const nextBtn = document.getElementById('btn-next');
            if(nextBtn) nextBtn.style.display = 'none';
        }
    } catch (error) {
        console.error(error);
        if (questionText) questionText.innerText = 'เกิดข้อผิดพลาดในการโหลดไฟล์ ' + filename;
    }
}

function parseCsvInsideTxt(text) {
    const questions = [];
    const lines = text.split(/\r?\n/);

    lines.forEach((line) => {
        if (!line.trim()) return;

        let parts = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            let char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                parts.push(current.trim().replace(/^"|"$/g, ''));
                current = '';
            } else {
                current += char;
            }
        }
        parts.push(current.trim().replace(/^"|"$/g, ''));

        if (parts.length < 6) return;

        const qText = parts[0];
        let ansNum = 1;
        try { ansNum = parseInt(parts[1]) || 1; } catch(e) { ansNum = 1; }
        const ansIndex = ansNum - 1;

        let options = [];
        for (let i = 2; i <= 5; i++) {
            if (parts[i]) {
                let opt = parts[i];
                if (opt && opt !== '-') options.push(opt);
            }
        }

        let imagePath = null;
        for (let i = 0; i < parts.length; i++) {
            let p = parts[i].trim().replace(/^"|"$/g, '');
            let lowerP = p.toLowerCase();
            if (lowerP.endsWith('.png') || lowerP.endsWith('.jpg') || lowerP.endsWith('.jpeg')) {
                imagePath = p;
                break;
            }
        }

        if (qText && options.length > 0) {
            questions.push({
                id: questions.length + 1,
                question: qText,
                image: imagePath,
                options: options,
                answer: ansIndex
            });
        }
    });

    return questions;
}

function changeCategory() {
    const selectElement = document.getElementById('licenseCategory');
    if (!selectElement) return;
    const selectedFile = selectElement.value;
    
    const homeSelect = document.getElementById('homeCategory');
    if (homeSelect && !homeSelect.disabled) homeSelect.value = selectedFile;

    currentCategoryFile = selectedFile;
    if (homeSelect && !homeSelect.disabled) {
        localStorage.setItem('lao_quiz_selected_category', selectedFile);
    }
    checkHomeUnlockStatus();
    fetchQuestions(selectedFile, false);
}

function saveQuizState() {
    if (currentMode === 'review_wrong') return;
    if (hasSkipped) {
        localStorage.removeItem('lao_quiz_state_' + currentMode + '_' + currentCategoryFile);
        return;
    }
    const stateData = {
        currentQuestionIndex: currentQuestionIndex,
        userAnswers: userAnswers,
        correctCount: correctCount,
        wrongCount: wrongCount,
        quizQuestions: (currentMode === 'random') ? quizQuestions : undefined
    };
    localStorage.setItem('lao_quiz_state_' + currentMode + '_' + currentCategoryFile, JSON.stringify(stateData));
}

function loadQuestion() {
    if (quizQuestions.length === 0) return;

    const resultScreen = document.getElementById('result-screen');
    if (resultScreen) resultScreen.style.display = 'none';

    const quizScreen = document.getElementById('quiz-screen');
    if (quizScreen) quizScreen.style.display = 'flex';

    const nextBtn = document.getElementById('btn-next');
    if(nextBtn) nextBtn.style.display = 'block';

    const q = quizQuestions[currentQuestionIndex];
    isAnswered = (currentMode === 'study') ? true : (userAnswers[currentQuestionIndex] !== undefined);

    const qCount = document.getElementById('question-count');
    if (qCount) qCount.innerText = `ຄຳຖາມທີ ${currentQuestionIndex + 1} ຈາກ ${quizQuestions.length}`;

    const qText = document.getElementById('question-text');
    if (qText) qText.innerText = q.question;

    const imgContainer = document.getElementById('image-container');
    if (imgContainer) {
        imgContainer.innerHTML = q.image ? `<img src="${q.image}" alt="Traffic Sign">` : '';
    }

    const optionsContainer = document.getElementById('options-container');
    if (optionsContainer) {
        optionsContainer.innerHTML = '';
        const laoLetters = ['ກ', 'ຂ', 'ຄ', 'ງ'];

        q.options.forEach((opt, idx) => {
            const isChecked = userAnswers[currentQuestionIndex] === idx;
            let optionStyle = "display: flex !important; align-items: center !important; padding: 10px 12px !important; border-radius: 6px !important; margin-bottom: 6px !important; cursor: pointer !important; font-size: 0.9rem !important; line-height: 1.35 !important; font-weight: bold !important; color: #ffffff !important; background: transparent !important; border: 1px solid rgba(255, 255, 255, 0.15) !important;";

            if (currentMode === 'study') {
                if (idx === q.answer) optionStyle = "display: flex !important; align-items: center !important; padding: 10px 12px !important; border-radius: 6px !important; margin-bottom: 6px !important; cursor: pointer !important; font-size: 0.9rem !important; line-height: 1.35 !important; font-weight: bold !important; color: #ffffff !important; background-color: #15803d !important; border: 1px solid #16a34a !important;";
            } else {
                if (isAnswered) {
                    if (idx === q.answer) optionStyle = "display: flex !important; align-items: center !important; padding: 10px 12px !important; border-radius: 6px !important; margin-bottom: 6px !important; cursor: pointer !important; font-size: 0.9rem !important; line-height: 1.35 !important; font-weight: bold !important; color: #ffffff !important; background-color: #15803d !important; border: 1px solid #16a34a !important;"; 
                    else if (isChecked && idx !== q.answer) optionStyle = "display: flex !important; align-items: center !important; padding: 10px 12px !important; border-radius: 6px !important; margin-bottom: 6px !important; cursor: pointer !important; font-size: 0.9rem !important; line-height: 1.35 !important; font-weight: bold !important; color: #ffffff !important; background-color: #b91c1c !important; border: 1px solid #dc2626 !important;"; 
                }
            }

            const letterLabel = laoLetters[idx] || (idx + 1);
            optionsContainer.innerHTML += `
                <label class="option-label" onclick="selectOption(${idx})" style="${optionStyle}">
                    <input type="radio" name="option" value="${idx}" ${isChecked ? 'checked' : ''} ${isAnswered && currentMode !== 'study' ? 'disabled' : ''} style="display: none;">
                    <span style="margin-right: 8px; color: #ffffff;">${letterLabel}.</span>
                    <span style="color: #ffffff;">${opt}</span>
                </label>
            `;
        });
    }

    if (nextBtn) {
        if (currentQuestionIndex === quizQuestions.length - 1) {
            nextBtn.innerText = (currentMode === 'study') ? 'ເກັງຫລາຍ ອ່ານຈົບແລ້ວ ກົດໄປຕໍ່' : 'ສົ່ງຂໍ້ສອບ';
            nextBtn.className = 'btn-submit';
        } else {
            nextBtn.innerText = 'ຕໍ່ໄປ';
            nextBtn.className = 'btn-next';
        }

        if (currentMode !== 'study' && !isAnswered) {
            nextBtn.style.opacity = '0.5';
            nextBtn.style.cursor = 'not-allowed';
        } else {
            nextBtn.style.opacity = '1';
            nextBtn.style.cursor = 'pointer';
        }
    }

    saveQuizState();
}

function selectOption(index) {
    if (currentMode === 'study') return;
    if (isAnswered) return; 

    userAnswers[currentQuestionIndex] = index;
    isAnswered = true;

    const q = quizQuestions[currentQuestionIndex];
    let existingWrong = JSON.parse(localStorage.getItem('lao_quiz_wrong_' + currentCategoryFile)) || [];

    if (index === q.answer) {
        correctCount++;
        if (currentMode === 'review_wrong') {
            existingWrong = existingWrong.filter(item => item.question !== q.question);
            localStorage.setItem('lao_quiz_wrong_' + currentCategoryFile, JSON.stringify(existingWrong));
            wrongQuestionsList = existingWrong;
        }
    } else {
        wrongCount++;
        if (!existingWrong.some(e => e.question === q.question)) {
            existingWrong.push(q);
            localStorage.setItem('lao_quiz_wrong_' + currentCategoryFile, JSON.stringify(existingWrong));
        }
        if (!wrongQuestionsList.some(item => item.question === q.question)) {
            wrongQuestionsList.push(q);
        }
    }
    updateLiveScore();
    saveQuizState();
    loadQuestion(); 
}

function updateLiveScore() {
    const correctEl = document.getElementById('live-correct');
    const wrongEl = document.getElementById('live-wrong');
    if (correctEl) correctEl.innerText = correctCount;
    if (wrongEl) wrongEl.innerText = wrongCount;
}

function nextQuestion() {
    if (currentMode !== 'study' && !isAnswered) {
        alert('ກະລຸນາເລືອກຄຳຕອບກ່ອນກົດໄປຂໍ້ຖັດໄປ!');
        return;
    }

    if (currentQuestionIndex < quizQuestions.length - 1) {
        currentQuestionIndex++;
        saveQuizState();
        loadQuestion();
    } else {
        localStorage.removeItem('lao_quiz_state_' + currentMode + '_' + currentCategoryFile);

        if (currentMode === 'study') {
            localStorage.setItem(`lao_quiz_study_passed_${currentCategoryFile}`, 'true');
            sendResultsToTelegram('ອ່ານຈົບໝວດທີ 1 ແລ້ວ 📖');
            showStudyCompleteScreen();
        } else if (currentMode === 'review_wrong') {
            let remainingWrong = JSON.parse(localStorage.getItem('lao_quiz_wrong_' + currentCategoryFile)) || [];
            if (remainingWrong.length > 0) {
                alert(`⚠️ ຍັງມີຂໍ້ທີ່ຕອບຜິດຄ້າງຢູ່ ${remainingWrong.length} ຂໍ້! ລະບົບຈະວນກັບມາໃຫ້ແກ້ຈົນກວ່າຈະຖືກໝົດ`);
                startApp('review_wrong'); 
            } else {
                sendResultsToTelegram('ແກ້ໄຂຂໍ້ຜິດຄົບຖ້ວນສົມບູນ 🎯');
                showReviewWrongCompleteScreen(); 
            }
        } else {
            if (currentMode === 'quiz') {
                localStorage.setItem(`lao_quiz_quiz_passed_${currentCategoryFile}`, 'true');
            } else if (currentMode === 'random') {
                localStorage.setItem(`lao_quiz_random_passed_${currentCategoryFile}`, 'true');
            }
            incrementCompletedRounds(currentMode, currentCategoryFile);
            
            const isPassed = wrongCount <= 10;
            if (isPassed) incrementPassedRounds(currentCategoryFile);

            sendResultsToTelegram(isPassed ? 'ສອບເສັງຜ່ານ ✅' : 'ສອບເສັງບໍ່ຜ່ານ ❌');
            showResults();
        }
    }
}

function jumpToLastQuestion() {
    if (quizQuestions.length === 0) return;
    hasSkipped = true;
    currentQuestionIndex = quizQuestions.length - 1;
    loadQuestion();
}

function showStudyCompleteScreen() {
    const quizScreen = document.getElementById('quiz-screen');
    if (quizScreen) quizScreen.style.display = 'none';

    const resultScreen = document.getElementById('result-screen');
    if (resultScreen) resultScreen.style.display = 'block';
    
    const finalScore = document.getElementById('final-score');
    const scoreMsg = document.getElementById('score-message');
    const actionButtons = document.getElementById('result-action-buttons');

    if (hasSkipped) {
        if (finalScore) finalScore.innerHTML = '⚠️ ທ່ານໄດ້ກົດຂ້າມ (ມີການກົດຂ້າມ)';
        if (scoreMsg) scoreMsg.innerHTML = '⚠️ ທ່ານໄດ້ກົດຂ້າມຂັ້ນຕອນ! ລະບົບເຕືອນ: ຖືວ່າອ່ານບໍ່ຈົບ ຕ້ອງທົບທວນໃໝ່';
        
        if (actionButtons) {
            actionButtons.innerHTML = `
                <button onclick="startApp('study')" style="padding: 11px; font-size: 0.9rem; font-weight: bold; background: #0284c7; color: white; border: none; border-radius: 8px; cursor: pointer; width: 100%;">
                    🔄 ເລີ່ມຕົ້ນໃໝ່
                </button>
                <button onclick="goHome()" style="padding: 10px; font-size: 0.85rem; font-weight: bold; background: #475569; color: white; border: none; border-radius: 8px; cursor: pointer; width: 100%;">
                    🏠 ກຼັບຄືນໜ້າທຳອິດ
                </button>
            `;
        }
        return;
    } else {
        if (finalScore) finalScore.innerHTML = '🎉 ທ່ານອ່ານທົບທວນຄຳຖາມຈົບໝົດທຸກຂໍ້ແລ້ວ!';
        if (scoreMsg) scoreMsg.innerHTML = 'ຍິນດີດ້ວຍ! ທ່ານໄດ້ປົດລັອກ ໝວດທີ 2 (ແບບທົດສອບ) ແລະ ໝວດທີ 4 (ແກ້ໄຂຂໍ້ຜິດ) ແລ້ວ!';
    }
    
    if (actionButtons) {
        actionButtons.innerHTML = `
            <button onclick="startApp('quiz')" style="padding: 11px; font-size: 0.9rem; font-weight: bold; background: #f57f17; color: white; border: none; border-radius: 8px; cursor: pointer; width: 100%;">
                📝 ໄປລອງທົດສອບໃນໝວດທີ 2 ເລີຍ
            </button>
            <button onclick="goHome()" style="padding: 10px; font-size: 0.85rem; font-weight: bold; background: #475569; color: white; border: none; border-radius: 8px; cursor: pointer; width: 100%;">
                🏠 กลับไปหน้าหลัก
            </button>
        `;
    }
}

function showReviewWrongCompleteScreen() {
    const quizScreen = document.getElementById('quiz-screen');
    if (quizScreen) quizScreen.style.display = 'none';

    const resultScreen = document.getElementById('result-screen');
    if (resultScreen) resultScreen.style.display = 'block';
    
    const finalScore = document.getElementById('final-score');
    const scoreMsg = document.getElementById('score-message');
    const actionButtons = document.getElementById('result-action-buttons');

    if (finalScore) finalScore.innerHTML = '🎉 ຍິນດີນຳ ທ່ານໄດ້ແກ້ໄຂທັງໝົດຖືກຕ້ອງຄົບແລ້ວ';
    if (scoreMsg) scoreMsg.innerHTML = 'ສຸດຍອດທ່ານໄດ້ຕອບຖືກຄົບທຸກຂໍ້ທີ່ເຄຍເຮັດຜິດໄວ້ ເລືອກເຂົ້າໄປຮຽນລຸ່ມນີ້';

    if (actionButtons) {
        actionButtons.innerHTML = `
            <button onclick="startApp('quiz')" style="padding: 11px; font-size: 0.9rem; font-weight: bold; background: #f57f17; color: white; border: none; border-radius: 8px; cursor: pointer; width: 100%;">
                📝 2. ໝວດແບບທົດສອບ (ມີຄະແນນ)
            </button>
            <button onclick="startApp('random')" style="padding: 11px; font-size: 0.9rem; font-weight: bold; background: #7e22ce; color: white; border: none; border-radius: 8px; cursor: pointer; width: 100%;">
                🔀 3. ໝວດສະຫຼັບຄຳຖາມ (Random)
            </button>
            <button onclick="goHome()" style="padding: 10px; font-size: 0.85rem; font-weight: bold; background: #475569; color: white; border: none; border-radius: 8px; cursor: pointer; width: 100%;">
                🏠 ກຼັບຄືນໜ້າທຳອິດ
            </button>
        `;
    }
}

function showResults() {
    const quizScreen = document.getElementById('quiz-screen');
    if (quizScreen) quizScreen.style.display = 'none';

    const resultScreen = document.getElementById('result-screen');
    if (resultScreen) resultScreen.style.display = 'block';
    
    const actionButtons = document.getElementById('result-action-buttons');
    let reviewButtonHtml = '';

    const finalScore = document.getElementById('final-score');
    const scoreMsg = document.getElementById('score-message');
    const resultRoundDisplay = document.getElementById('result-round-display');

    const totalRounds = getCompletedRounds(currentMode, currentCategoryFile);
    const passedRounds = getPassedRounds(currentCategoryFile);

    if (resultRoundDisplay) {
        resultRoundDisplay.innerHTML = `🏆 ຜ່ານແລ້ວ: ${passedRounds} ຮອບ | 🔄 ເຮັດຈົບ: ${totalRounds} ຮອບ`;
    }

    if (hasSkipped) {
        if (finalScore) finalScore.innerText = `❌ ສອບເສັງບໍ່ຜ່ານ (ມີການກົດຂ້າມ)`;
        if (scoreMsg) scoreMsg.innerText = `⚠️ ທ່ານໄດ້ກົດຂ້າມ! ລະບົບເຕືອນ: ສອບບໍ່ຜ່ານ ຕ້ອງສອບເສັງໃໝ່!`;
        wrongCount = 999; 

        if (actionButtons) {
            actionButtons.innerHTML = `
                <button onclick="startApp('${currentMode}')" style="padding: 11px; font-size: 0.9rem; font-weight: bold; background: #0284c7; color: white; border: none; border-radius: 8px; cursor: pointer; width: 100%;">
                    🔄 ເລີ່ມຕົ້ນໃໝ່
                </button>
                <button onclick="goHome()" style="padding: 10px; font-size: 0.85rem; font-weight: bold; background: #475569; color: white; border: none; border-radius: 8px; cursor: pointer; width: 100%;">
                    🏠 ກຼັບຄືນໜ້າທຳອິດ
                </button>
            `;
        }
        return;
    } else {
        if (finalScore) finalScore.innerText = `ຜິດພາດ: ${wrongCount} ຂໍ້ (ຈາກ ${quizQuestions.length} ຂໍ້)`;
        const isPassed = wrongCount <= 10;
        const msg = isPassed
            ? `🎉 ຍິນດີດ້ວຍ! ທ່ານຜ່ານການສອບເສັງ (ຜິດ ${wrongCount} ຂໍ້ ເຊິ່ງບໍ່ເກີນເກນ 10 ຂໍ້)`
            : `❌ ທ່ານບໍ່ຜ່ານການສອບເສັງ (ຜິດ ${wrongCount} ຂໍ້ ເຊິ່ງເກີນເກນ 10 ຂໍ້)`;
        if (scoreMsg) scoreMsg.innerText = msg;
    }

    let currentWrongSaved = JSON.parse(localStorage.getItem('lao_quiz_wrong_' + currentCategoryFile)) || [];
    if (currentWrongSaved.length > 0 && !hasSkipped) {
        reviewButtonHtml = `
            <button onclick="startApp('review_wrong')" style="padding: 11px; font-size: 0.9rem; font-weight: bold; background: #dc2626; color: white; border: none; border-radius: 8px; cursor: pointer; width: 100%;">
                🎯 ໄປແກ້ສະເພາະຂໍ້ທີ່ຜິດ (${currentWrongSaved.length} ຂໍ້)
            </button>
        `;
    }

    if (actionButtons) {
        actionButtons.innerHTML = `
            ${reviewButtonHtml}
            <button onclick="restartQuiz()" class="btn-restart" style="width: 100%; background: #0284c7;">ເລີ່ມສອບໃໝ່</button>
            <button onclick="goHome()" style="padding: 10px; font-size: 0.85rem; font-weight: bold; background: #475569; color: white; border: none; border-radius: 8px; cursor: pointer; width: 100%;">
                🏠 กลับไปหน้าหลัก
            </button>
        `;
    }
}

function restartQuiz() {
    localStorage.removeItem('lao_quiz_state_' + currentMode + '_' + currentCategoryFile);
    isAnswered = false;
    correctCount = 0;
    wrongCount = 0;
    hasSkipped = false;
    wrongQuestionsList = [];
    updateLiveScore();
    goHome();
}

window.onload = function() {
    const selectElement = document.getElementById('licenseCategory');
    const initialFile = selectElement ? selectElement.value : 'ABC.txt';
    currentCategoryFile = initialFile;
    checkHomeUnlockStatus(); 
    sendLoginNotificationToTelegram();
};

// 🚀 ฟังก์ชันเปิดหน้าหมวดที่ 5 (ดึงประเภทที่เลือกจริงอย่างแม่นยำ 100%)
function openCategory5() {
    const nameInput = document.getElementById('studentName');
    const ageInput = document.getElementById('studentAge');
    const phoneInput = document.getElementById('studentPhone');
    const homeSelect = document.getElementById('homeCategory');

    const name = nameInput ? nameInput.value.trim() : (localStorage.getItem('lao_quiz_student_name') || '');
    const age = ageInput ? ageInput.value.trim() : (localStorage.getItem('lao_quiz_student_age') || '');
    const phone = phoneInput ? phoneInput.value.trim() : (localStorage.getItem('lao_quiz_student_phone') || '');

    if (!name || !age || !phone) {
        alert('⚠️ ຖ້າກະລຸນາ ໃສ່ຊື່, ອາຍຸ ແລະ ເບີໂທລະສັບ ໃຫ້ຄົບຖ້ວນກ່ອນເລີ່ມຕົ້ນ!');
        if (nameInput) nameInput.focus();
        return;
    }

    // 📌 ดึงค่าจาก homeSelect หรือ localStorage โดยบังคับให้ถูกต้องตามที่เลือกจริง
    let selectedCategory = homeSelect ? homeSelect.value : '';
    if (!selectedCategory) {
        selectedCategory = localStorage.getItem('lao_quiz_selected_category') || 'A.txt';
    }

    const isQuizPassed = (localStorage.getItem(`lao_quiz_quiz_passed_${selectedCategory}`) === 'true') || teacherTempUnlocked || (localStorage.getItem(`lao_quiz_teacher_secret_${selectedCategory}`) === 'true');

    if (!isQuizPassed) {
        alert('⚠️ ຍັງບໍ່ສາມາດເຂົ້າໃຊ້ງານໄດ້!\nກະລຸນາອ່ານແບບທົດສອບ (ໝວດ 2) ໃຫ້ຈົບທຸກຂໍ້ກ່ອນ');
        return;
    }

    localStorage.setItem('lao_quiz_student_name', name);
    localStorage.setItem('lao_quiz_student_age', age);
    localStorage.setItem('lao_quiz_student_phone', phone);
    localStorage.setItem('lao_quiz_selected_category', selectedCategory);

    // ส่งแจ้งเตือนเข้า Telegram ว่ากำลังเข้าหมวดที่ 5
    const licenseTypeOnly = selectedCategory.replace('.txt', '').toUpperCase();
    let startMsg = `📚 🚀 ນັກຮຽນກຳລັງເລີ່ມເຂົ້າຮຽນແລ້ວ 🚀 📚\n`;
    startMsg += `👤 ຊື່: ${name} (ອາຍຸ: ${age} ປີ)\n`;
    startMsg += `📞 ເບີໂທ: ${phone}\n`;
    startMsg += `🚗 ປະເພດໃບຂັບຂີ່: ${licenseTypeOnly}\n`;
    startMsg += `📌 ກຳລັງເຂົ້າຮຽນໃນ: 🚀 5. ໝວດທີ 5 (ສອບເສັງຈຳລອງພິເສດ) (ເລີ່ມຕົ້ນທີ່ຂໍ້ 1) ✅`;
    sendToTelegramAPI(startMsg);

    setTimeout(() => {
        window.location.href = 'category5.html';
    }, 300);
}