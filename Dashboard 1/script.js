/**
 * VoltEdge Smart Energy Dashboard Logic
 * تم برمجة هذا النظام ليعتمد على 2026 كنقطة انطلاق البيانات
 */

// 1. إدارة الحالة (State)
const state = {
    sections: [
        { id: 's1', name: 'المبنى الإداري', rooms: [{ id: 'r1', name: 'قاعة الاجتماعات' }, { id: 'r2', name: 'المكتب الرئيسي' }] },
        { id: 's2', name: 'مركز البيانات', rooms: [{ id: 'r3', name: 'غرفة الخوادم A' }] }
    ],
    currentView: 'total',
    selectedRoom: null,
    selectedSection: null
};

// 2. إدارة الرسوم البيانية (Charts)
let charts = {
    main: null,
    donut: null,
    room: null
};

const chartConfig = {
    initMain(data = [12, 19, 15, 25, 22, 30, 28]) {
        const ctx = document.getElementById('mainChart').getContext('2d');
        if (charts.main) charts.main.destroy();
        charts.main = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
                datasets: [{
                    label: 'الاستهلاك (kWh)',
                    data: data,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.05)',
                    borderWidth: 4,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#f59e0b'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } },
                    x: { grid: { display: false }, ticks: { color: '#64748b' } }
                }
            }
        });
    },
    initDonut(data = [60, 40]) {
        const ctx = document.getElementById('donutChart').getContext('2d');
        if (charts.donut) charts.donut.destroy();
        charts.donut = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: state.sections.map(s => s.name),
                datasets: [{
                    data: data,
                    backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'],
                    borderWidth: 0,
                    hoverOffset: 20
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '80%',
                plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 20, font: { family: 'Cairo' } } } }
            }
        });
    },
    initRoomChart(data1 = [0,0,0,0], data2 = [0,0,0,0]) {
        const ctx = document.getElementById('roomChart').getContext('2d');
        if (charts.room) charts.room.destroy();
        charts.room = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['08:00', '12:00', '16:00', '20:00'],
                datasets: [
                    { label: 'الإشغال %', data: data1, backgroundColor: '#3b82f6', borderRadius: 8 },
                    { label: 'الطاقة %', data: data2, backgroundColor: '#f59e0b', borderRadius: 8 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }
};

// 3. منطق البيانات والتحقق من التاريخ (Data Store)
const dataStore = {
    validateDate() {
        const start = new Date(document.getElementById('date-start').value);
        const baseline = new Date('2026-01-01');
        const isPast = start < baseline;
        
        const warning = document.getElementById('baseline-warning');
        isPast ? warning.classList.remove('hidden') : warning.classList.add('hidden');
        
        return !isPast; // يعيد true إذا كان التاريخ 2026 فما فوق
    },

    refresh() {
        const isValid = this.validateDate();
        
        if (!isValid) {
            // تصفير الواجهة العامة
            document.getElementById('kpi-total-energy').innerHTML = '0 <span class="text-sm text-amber-500 font-medium">kWh</span>';
            document.getElementById('kpi-active-rooms').innerHTML = '0 <span class="text-sm text-slate-500">/ 24</span>';
            document.getElementById('kpi-co2').innerHTML = '0.00 <span class="text-sm text-slate-500 font-medium">Ton</span>';
            document.getElementById('kpi-savings').innerHTML = '$0';
            
            chartConfig.initMain([0, 0, 0, 0, 0, 0, 0]);
            chartConfig.initDonut([0, 0, 0, 0]);
            
            if (state.currentView === 'room') this.updateRoomView(state.selectedSection, state.selectedRoom, false);
        } else {
            // إعادة البيانات الوهمية
            document.getElementById('kpi-total-energy').innerHTML = '12,482 <span class="text-sm text-amber-500 font-medium">kWh</span>';
            document.getElementById('kpi-active-rooms').innerHTML = '18 <span class="text-sm text-slate-500">/ 24</span>';
            document.getElementById('kpi-co2').innerHTML = '0.84 <span class="text-sm text-slate-500 font-medium">Ton</span>';
            document.getElementById('kpi-savings').innerHTML = '$3,120';
            
            chartConfig.initMain();
            chartConfig.initDonut();
            
            if (state.currentView === 'room') this.updateRoomView(state.selectedSection, state.selectedRoom, true);
        }
    },

    updateRoomView(sId, rId, isValid) {
        const section = state.sections.find(s => s.id === sId);
        const room = section.rooms.find(r => r.id === rId);
        const aiContainer = document.getElementById('ai-messages');
        
        document.getElementById('room-detail-name').innerText = room.name;
        document.getElementById('breadcrumb-section').innerText = section.name;

        if (!isValid) {
            ['room-kpi-1', 'room-kpi-2', 'room-kpi-3', 'room-kpi-4'].forEach(id => document.getElementById(id).innerText = '0');
            chartConfig.initRoomChart([0,0,0,0], [0,0,0,0]);
            aiContainer.innerHTML = `
                <div class="flex gap-3 text-red-400 items-start">
                    <i class="fas fa-info-circle mt-1"></i>
                    <p>لا يمكن للذكاء الاصطناعي تحليل البيانات التاريخية لما قبل فترة تفعيل السحابة (يناير 2026).</p>
                </div>`;
        } else {
            document.getElementById('room-kpi-1').innerText = '42.5 kWh';
            document.getElementById('room-kpi-2').innerText = '85%';
            document.getElementById('room-kpi-3').innerText = 'ممتازة';
            document.getElementById('room-kpi-4').innerText = '$14.20';
            chartConfig.initRoomChart([40, 80, 90, 30], [20, 70, 85, 40]);
            aiContainer.innerHTML = `
                <div class="flex gap-3 items-start p-3 bg-amber-500/5 rounded-xl border border-amber-500/10">
                    <i class="fas fa-bolt text-amber-500 mt-1"></i>
                    <p>تم رصد استهلاك مرتفع بين الساعة 12 و 4 مساءً رغم ثبات الإشغال. ننصح بتعديل درجة حرارة التكييف درجتين إضافيتين.</p>
                </div>
                <div class="flex gap-3 items-start p-3">
                    <i class="fas fa-leaf text-emerald-500 mt-1"></i>
                    <p>أداء الغرفة مثالي جداً من حيث الانبعاثات مقارنة بالأسبوع الماضي.</p>
                </div>`;
        }
    }
};

// 4. نظام التنقل (Router)
const router = {
    navigate(view, sId = null, rId = null) {
        state.currentView = view;
        const totalView = document.getElementById('view-total');
        const roomView = document.getElementById('view-room');
        const navTotal = document.getElementById('nav-total');

        if (view === 'total') {
            totalView.classList.remove('hidden-view');
            roomView.classList.add('hidden-view');
            navTotal.classList.add('sidebar-item-active');
            document.getElementById('current-view-title').innerText = 'إحصائيات الشبكة العالمية';
            dataStore.refresh();
        } else {
            totalView.classList.add('hidden-view');
            roomView.classList.remove('hidden-view');
            navTotal.classList.remove('sidebar-item-active');
            state.selectedSection = sId;
            state.selectedRoom = rId;
            dataStore.updateRoomView(sId, rId, dataStore.validateDate());
        }
        ui.renderSidebar();
    }
};

// 5. واجهة المستخدم (UI Actions)
const ui = {
    renderSidebar() {
        const list = document.getElementById('sections-list');
        list.innerHTML = '';
        state.sections.forEach(s => {
            const div = document.createElement('div');
            div.className = "px-2 py-1";
            div.innerHTML = `
                <div class="flex items-center justify-between p-2 text-slate-400 hover:text-white cursor-pointer hover:bg-slate-800/50 rounded-lg group" onclick="this.nextElementSibling.classList.toggle('hidden')">
                    <div class="flex items-center gap-3">
                        <i class="fas fa-building text-xs"></i>
                        <span class="text-sm font-medium">${s.name}</span>
                    </div>
                    <i class="fas fa-chevron-down text-[10px] opacity-50 group-hover:opacity-100"></i>
                </div>
                <div class="space-y-1 mt-1 mr-6 border-r border-slate-800 pr-2">
                    ${s.rooms.map(r => `
                        <div onclick="router.navigate('room', '${s.id}', '${r.id}')" class="text-xs py-2 px-3 rounded-lg hover:text-amber-500 cursor-pointer transition-colors ${state.selectedRoom === r.id ? 'text-amber-500 font-bold bg-amber-500/5' : 'text-slate-500'}">
                            ${r.name}
                        </div>
                    `).join('')}
                    <div onclick="ui.openModal('room', '${s.id}')" class="text-[10px] py-2 px-3 text-slate-600 hover:text-slate-400 cursor-pointer italic">
                        + إضافة غرفة...
                    </div>
                </div>
            `;
            list.appendChild(div);
        });
    },

    openModal(type, parentId = null) {
        const overlay = document.getElementById('modal-overlay');
        const content = document.getElementById('modal-content');
        const btn = document.getElementById('modal-action-btn');
        
        overlay.classList.remove('hidden');
        setTimeout(() => {
            content.classList.remove('scale-95', 'opacity-0');
        }, 10);

        if (type === 'section') {
            document.getElementById('modal-title').innerText = 'إضافة قسم جديد';
            btn.onclick = () => {
                const val = document.getElementById('modal-input').value;
                if (val) {
                    state.sections.push({ id: 's' + Date.now(), name: val, rooms: [] });
                    this.closeModal();
                    this.renderSidebar();
                }
            };
        } else {
            document.getElementById('modal-title').innerText = 'إضافة غرفة جديدة';
            btn.onclick = () => {
                const val = document.getElementById('modal-input').value;
                if (val) {
                    const section = state.sections.find(s => s.id === parentId);
                    section.rooms.push({ id: 'r' + Date.now(), name: val });
                    this.closeModal();
                    this.renderSidebar();
                }
            };
        }
    },

    closeModal() {
        const overlay = document.getElementById('modal-overlay');
        overlay.classList.add('hidden');
        document.getElementById('modal-input').value = '';
    }
};

// تشغيل النظام
window.onload = () => {
    router.navigate('total');
};