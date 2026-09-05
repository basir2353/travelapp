import fs from 'fs';

const files = [
  'src/components/travel/EthioHome.tsx',
  'src/components/travel/EthioFunnel.tsx',
  'src/components/travel/TravelServiceSheet.tsx',
  'src/components/travel/TravelDocsSheet.tsx',
  'src/components/travel/EthioSheets.tsx',
  'src/components/AuthGate.tsx',
  'src/pages/Onboarding.tsx',
  'src/components/ForgotPinFlow.tsx',
  'src/components/travel/EthioSheets.tsx',
];

const reps = [
  [/className="w-full text-left rounded-\[10px\] p-3"\s*style=\{\{\s*backgroundColor: KTA\.bg\s*\}\}/g, 'className="w-full text-left glass-field rounded-ios-md p-3"'],
  [/className="text-left rounded-\[10px\] p-3"\s*style=\{\{\s*backgroundColor: KTA\.bg\s*\}\}/g, 'className="text-left glass-field rounded-ios-md p-3"'],
  [/className="rounded-\[10px\] p-2\.5 text-left"\s*style=\{\{\s*backgroundColor: KTA\.bg\s*\}\}/g, 'className="glass-field rounded-ios-md p-2.5 text-left"'],
  [/className="rounded-\[10px\] p-2\.5 mb-3"\s*style=\{\{\s*backgroundColor: KTA\.bg\s*\}\}/g, 'className="glass-field rounded-ios-md p-2.5 mb-3"'],
  [/className="rounded-\[10px\] p-2\.5"\s*style=\{\{\s*backgroundColor: KTA\.bg\s*\}\}/g, 'className="glass-field rounded-ios-md p-2.5"'],
  [/className="w-full h-10 px-3 rounded-\[10px\] border text-\[13px\] outline-none focus:border-green-600" style=\{\{ borderColor: KTA\.border, backgroundColor: KTA\.bg \}\}/g, 'className="glass-funnel-input"'],
  [/className="w-full h-10 px-3 rounded-\[10px\] border text-\[13px\] outline-none bg-transparent focus:border-green-600" style=\{\{ borderColor: KTA\.border, backgroundColor: KTA\.bg \}\}/g, 'className="glass-funnel-input"'],
  [/className="flex-1 min-h-0 flex flex-col relative"\s*style=\{\{\s*backgroundColor: KTA\.bg\s*\}\}/g, 'className="flex-1 min-h-0 flex flex-col relative"'],
  [/className="px-\[18px\] pt-4 pb-3 flex items-center gap-3"\s*style=\{\{\s*backgroundColor: KTA\.bg\s*\}\}/g, 'className="px-[18px] pt-4 pb-3 flex items-center gap-3 glass-panel"'],
  [/className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm"/g, 'className="w-9 h-9 rounded-full glass-pill flex items-center justify-center shadow-ios-xs"'],
  [/className="bg-white rounded-\[16px\] p-3\.5 flex items-center justify-between border border-slate-200 shadow-sm"/g, 'className="glass-card p-3.5 flex items-center justify-between"'],
  [/className="bg-white rounded-\[12px\] p-3 border border-slate-200 shadow-sm flex items-center gap-3"/g, 'className="glass-card p-3 flex items-center gap-3"'],
  [/className="bg-white rounded-\[16px\] border border-slate-200 shadow-sm/g, 'className="glass-card'],
  [/className="bg-white rounded-\[20px\] p-4 shadow-sm border border-slate-100"/g, 'className="glass-card-elevated p-4"'],
  [/className="border border-slate-200 rounded-\[16px\] p-4 mb-5"/g, 'className="glass-card p-4 mb-5"'],
  [/className="bg-white rounded-\[20px\] border border-slate-100 shadow-sm overflow-hidden"/g, 'className="glass-card overflow-hidden"'],
  [/className="rounded-\[16px\] border p-4 flex items-start gap-3 shadow-sm"/g, 'className="glass-card p-4 flex items-start gap-3"'],
  [/className="rounded-\[14px\] border p-3 space-y-1"/g, 'className="glass-card p-3 space-y-1"'],
  [/className="bg-red-50 rounded-\[16px\] border border-red-200 p-4/g, 'className="glass-alert-error p-4'],
  [/className="bg-amber-50 rounded-\[16px\] border border-amber-200 p-3/g, 'className="glass-alert-warning p-3'],
  [/className="bg-blue-50 rounded-\[16px\] border border-blue-200 p-3/g, 'className="glass-alert-info p-3'],
  [/className="px-3 py-1\.5 rounded-full border border-slate-200 text-\[12px\] font-medium text-slate-700 bg-white"/g, 'className="glass-chip px-3 py-1.5 text-[12px] font-medium text-text-primary"'],
  [/className="fixed inset-0 bg-black\/40 z-40"/g, 'className="fixed inset-0 glass-overlay z-40"'],
  [/className="fixed inset-0 bg-black\/40 z-\[70\]"/g, 'className="fixed inset-0 glass-overlay z-[70]"'],
  [/className="absolute inset-0 bg-black\/40 z-\[70\]"/g, 'className="absolute inset-0 glass-overlay z-[70]"'],
  [/className="fixed bottom-0 left-0 right-0 bg-white rounded-t-\[24px\] z-50 max-h-\[85vh\] flex flex-col"/g, 'className="fixed bottom-0 left-0 right-0 glass-sheet rounded-t-ios-xl z-50 max-h-[85vh] flex flex-col"'],
  [/className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl z-\[70\] flex flex-col max-h-\[92vh\]"/g, 'className="absolute bottom-0 left-0 right-0 glass-sheet rounded-t-ios-xl z-[70] flex flex-col max-h-[92vh]"'],
  [/className="flex flex-col h-full bg-white relative overflow-hidden"/g, 'className="glass-screen ui-app-bg"'],
  [/className="w-full p-5 rounded-2xl bg-red-50 border border-red-100 mb-6 text-center"/g, 'className="w-full max-w-[300px] p-5 glass-alert-error mb-6 text-center"'],
  [/bg-white\/72 backdrop-blur-glass-lg border border-white\/50 shadow-ios-sm rounded-ios-lg/g, 'glass-card'],
  [/className="rounded-\[14px\] p-4 border"\s*style=\{\{\s*borderColor: KTA\.border,\s*backgroundColor: KTA\.bg\s*\}\}/g, 'className="glass-pricing p-4"'],
  [/className="w-8 h-8 rounded-full flex items-center justify-center"\s*style=\{\{\s*backgroundColor: KTA\.bg\s*\}\}/g, 'className="w-8 h-8 rounded-full glass-btn-ghost flex items-center justify-center"'],
  [/className="w-full flex items-center gap-3 rounded-\[14px\] border p-3 text-left transition-colors active:scale-\[0\.99\]"/g, 'className="w-full flex items-center gap-3 glass-doc-row p-3 text-left transition-all duration-ios active:scale-[0.99]"'],
  [/className="mt-3 flex items-start gap-2 rounded-\[12px\] p-3 bg-\[#fffbeb\] border border-amber-200"/g, 'className="mt-3 flex items-start gap-2 glass-alert-warning p-3"'],
  [/className="w-9 h-9 rounded-\[10px\] flex items-center justify-center shrink-0"\s*style=\{\{\s*backgroundColor: '#e6f4ea'\s*\}\}/g, 'className="w-9 h-9 rounded-ios-md glass-icon-wrap shrink-0"'],
  [/className="w-10 h-10 rounded-full flex items-center justify-center"\s*style=\{\{\s*backgroundColor: '#e6f4ea'\s*\}\}/g, 'className="w-10 h-10 rounded-full glass-icon-wrap"'],
  [/className="w-12 h-12 rounded-full flex items-center justify-center"\s*style=\{\{\s*backgroundColor: `\$\{KTA\.blue\}15`\s*\}\}/g, 'className="w-12 h-12 rounded-full glass-icon-wrap"'],
  [/className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"\s*style=\{\{\s*backgroundColor: `\$\{KTA\.blue\}10`\s*\}\}/g, 'className="w-8 h-8 rounded-full glass-icon-wrap shrink-0"'],
  [/className="flex flex-col h-full bg-white"/g, 'className="glass-screen ui-app-bg"'],
  [/className="flex flex-col h-full bg-white p-6"/g, 'className="glass-screen ui-app-bg p-6"'],
  [/className="flex flex-col h-full bg-white items-center justify-center p-6 text-center"/g, 'className="glass-screen ui-app-bg items-center justify-center p-6 text-center"'],
  [/className="px-6 pt-6 pb-8 z-10 bg-white"/g, 'className="px-6 pt-6 pb-8 z-10 glass-footer"'],
  [/className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"/g, 'className="w-10 h-10 rounded-full glass-btn-ghost flex items-center justify-center"'],
  [/className="rounded-2xl bg-gray-50 border border-gray-100 p-4 space-y-3"/g, 'className="glass-card p-4 space-y-3"'],
  [/className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100"/g, 'className="flex items-center gap-4 p-4 glass-card"'],
  [/className="w-full rounded-2xl border border-gray-100 bg-gray-50 p-4 mb-6 flex items-center gap-3"/g, 'className="w-full glass-card p-4 mb-6 flex items-center gap-3"'],
  [/className="w-9 h-9 rounded-full bg-white border border-gray-100 flex items-center justify-center"/g, 'className="w-9 h-9 rounded-full glass-pill flex items-center justify-center"'],
  [/className="w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center"/g, 'className="w-11 h-11 rounded-ios-md glass-pill flex items-center justify-center"'],
  [/className="fixed inset-0 bg-black\/50 z-50"/g, 'className="fixed inset-0 glass-overlay z-50"'],
  [/className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-w-\[430px\] mx-auto px-6 pt-3 pb-7 max-h-\[92vh\] overflow-y-auto"/g, 'className="fixed bottom-0 left-0 right-0 glass-sheet rounded-t-ios-xl z-50 max-w-[480px] mx-auto px-6 pt-4 pb-7 max-h-[92vh] overflow-y-auto"'],
  [/className="w-8 h-8 rounded-full bg-white border flex items-center justify-center"/g, 'className="w-8 h-8 rounded-full glass-pill flex items-center justify-center"'],
  [/className="mx-\[18px\] mb-2 w-\[calc\(100%-36px\)\] flex items-center justify-between rounded-\[12px\] border px-3\.5 py-2\.5"/g, 'className="mx-[18px] mb-2 w-[calc(100%-36px)] flex items-center justify-between glass-field rounded-ios-md px-3.5 py-2.5"'],
  [/className="bg-white rounded-\[16px\] border shadow-sm p-4 transition-colors"/g, 'className="glass-card p-4 transition-colors"'],
  [/className="w-full p-4 flex items-center justify-between bg-white active:bg-gray-50 transition-colors"/g, 'className="w-full p-4 flex items-center justify-between glass-card active:opacity-90 transition-all duration-ios"'],
  [/className="w-full h-10 pl-9 pr-3 rounded-\[10px\] border text-\[13px\] outline-none focus:border-green-600 transition-colors"/g, 'className="glass-funnel-input pl-9"'],
  [/className="w-\[140px\] shrink-0 text-left rounded-\[16px\] p-3 border-2 transition-all relative overflow-hidden"/g, 'className="w-[140px] shrink-0 text-left glass-pricing p-3 transition-all relative overflow-hidden"'],
  [/className="p-1\.5 rounded-full bg-white\/70 backdrop-blur-sm border border-white text-gray-600 active:bg-white"/g, 'className="p-1.5 rounded-full glass-pill text-text-secondary active:opacity-80"'],
  [/className="flex items-center gap-1\.5 px-2\.5 py-1 rounded-full bg-white\/70 backdrop-blur-sm border border-white"/g, 'className="flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-pill"'],
  [/className="absolute inset-0 bg-white\/90 backdrop-blur-sm flex flex-col items-center justify-center z-50"/g, 'className="absolute inset-0 glass-sheet flex flex-col items-center justify-center z-50"'],
];

for (const f of files) {
  let c = fs.readFileSync(f, 'utf8');
  let n = c;
  for (const [re, rep] of reps) n = n.replace(re, rep);
  if (n !== c) {
    fs.writeFileSync(f, n);
    console.log('updated', f);
  }
}
