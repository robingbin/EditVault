// Mock data for EditVault CRM

export const clients = [
  {
    id: 'c1',
    name: 'ABC Fitness',
    phone: '+91 98765 43210',
    email: 'contact@abcfitness.com',
    monthlyFee: 18000,
    pending: 0,
  },
  {
    id: 'c2',
    name: 'XYZ Builders',
    phone: '+91 87654 32109',
    email: 'info@xyzbuilders.com',
    monthlyFee: 12500,
    pending: 1,
  },
  {
    id: 'c3',
    name: 'Green Cafe',
    phone: '+91 76543 21098',
    email: 'hello@greencafe.com',
    monthlyFee: 8000,
    pending: 0,
  },
  {
    id: 'c4',
    name: 'Urban Styles',
    phone: '+91 65432 10987',
    email: 'team@urbanstyles.com',
    monthlyFee: 15000,
    pending: 1,
  },
  {
    id: 'c5',
    name: 'TechNova',
    phone: '+91 54321 09876',
    email: 'support@technova.in',
    monthlyFee: 20000,
    pending: 0,
  },
];

export const dashboardStats = {
  pendingWork: 6,
  awaitingClient: 2,
  activeClients: 5,
  thisMonthBilling: 8200,
  pendingPayment: 8200,
};

export const pendingVideos = [
  { id: 'v1', clientId: 'c1', clientName: 'ABC Fitness', video: 'Promo Video', dueDate: 'June 2026', editorStatus: 'In Progress', clientStatus: null, duration: '01:20', type: 'Advertisement' },
  { id: 'v2', clientId: 'c2', clientName: 'XYZ Builders', video: 'Site Tour Reel', dueDate: 'June 2026', editorStatus: 'Done', clientStatus: 'Correction', duration: '00:50', type: 'Reel' },
  { id: 'v3', clientId: 'c2', clientName: 'XYZ Builders', video: 'Project Showcase', dueDate: 'June 2026', editorStatus: 'In Progress', clientStatus: null, duration: '02:30', type: 'Advertisement' },
  { id: 'v4', clientId: 'c3', clientName: 'Green Cafe', video: 'Coffee Reel 01', dueDate: 'June 2026', editorStatus: 'Not Started', clientStatus: null, duration: '00:25', type: 'Reel' },
  { id: 'v5', clientId: 'c4', clientName: 'Urban Styles', video: 'Lookbook Reel', dueDate: 'June 2026', editorStatus: 'Done', clientStatus: 'Rejected', duration: '00:35', type: 'Reel' },
  { id: 'v6', clientId: 'c5', clientName: 'TechNova', video: 'Product Launch', dueDate: 'June 2026', editorStatus: 'In Progress', clientStatus: null, duration: '03:00', type: 'Advertisement' },
];

export const monthlyPayments = [
  { id: 'p1', clientId: 'c1', clientName: 'ABC Fitness', month: 'June 2026', totalAmount: 3200, status: 'Pending' },
  { id: 'p2', clientId: 'c2', clientName: 'XYZ Builders', month: 'June 2026', totalAmount: 1500, status: 'Pending' },
  { id: 'p3', clientId: 'c3', clientName: 'Green Cafe', month: 'June 2026', totalAmount: 1000, status: 'Pending' },
  { id: 'p4', clientId: 'c5', clientName: 'TechNova', month: 'June 2026', totalAmount: 2500, status: 'Pending' },
];

export const clientVideos = {
  c1: {
    months: {
      '2026-05': [],
      '2026-06': [
        { id: 1, sl: 1, name: 'Gym Reel 01', duration: '00:45', type: 'Reel', version: 'V3', editorStatus: 'Done', clientStatus: 'Posted', date: '15 Jun', amount: 600 },
        { id: 2, sl: 2, name: 'Gym Reel 02', duration: '00:30', type: 'Reel', version: 'V2', editorStatus: 'Done', clientStatus: 'Approved', date: '20 Jun', amount: 600 },
        { id: 3, sl: 3, name: 'Promo Video', duration: '01:20', type: 'Advertisement', version: 'V1', editorStatus: 'In Progress', clientStatus: null, date: null, amount: 1500 },
        { id: 4, sl: 4, name: 'Trainer Intro', duration: '02:10', type: 'Intro', version: 'V4', editorStatus: 'Done', clientStatus: 'Posted', date: '10 Jun', amount: 2000 },
      ],
    },
  },
  c2: {
    months: {
      '2026-05': [],
      '2026-06': [
        { id: 1, sl: 1, name: 'Site Tour Reel', duration: '00:50', type: 'Reel', version: 'V2', editorStatus: 'Done', clientStatus: 'Correction', date: '12 Jun', amount: 700 },
        { id: 2, sl: 2, name: 'Project Showcase', duration: '02:30', type: 'Advertisement', version: 'V1', editorStatus: 'In Progress', clientStatus: null, date: null, amount: 800 },
      ],
    },
  },
  c3: {
    months: {
      '2026-05': [],
      '2026-06': [
        { id: 1, sl: 1, name: 'Coffee Reel 01', duration: '00:25', type: 'Reel', version: 'V1', editorStatus: 'Not Started', clientStatus: null, date: null, amount: 500 },
        { id: 2, sl: 2, name: 'Cafe Vibes', duration: '00:40', type: 'Reel', version: 'V2', editorStatus: 'Done', clientStatus: 'Posted', date: '08 Jun', amount: 500 },
      ],
    },
  },
  c4: {
    months: {
      '2026-05': [],
      '2026-06': [
        { id: 1, sl: 1, name: 'Lookbook Reel', duration: '00:35', type: 'Reel', version: 'V3', editorStatus: 'Done', clientStatus: 'Rejected', date: '18 Jun', amount: 750 },
        { id: 2, sl: 2, name: 'Brand Story', duration: '01:50', type: 'Advertisement', version: 'V2', editorStatus: 'Done', clientStatus: 'Approved', date: '22 Jun', amount: 1200 },
      ],
    },
  },
  c5: {
    months: {
      '2026-05': [],
      '2026-06': [
        { id: 1, sl: 1, name: 'Product Launch', duration: '03:00', type: 'Advertisement', version: 'V1', editorStatus: 'In Progress', clientStatus: null, date: null, amount: 2500 },
      ],
    },
  },
};

export const getClientById = (id) => clients.find((c) => c.id === id);
