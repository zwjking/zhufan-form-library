/* ============================================================
   筑范 · 表单渲染引擎
   一份 JSON 定义 → 网页 A4 预览 / 打印 PDF / Word / Excel
   全部使用 table 布局，保证浏览器与 Word 渲染一致
   ============================================================ */
(function (global) {
  'use strict';

  function esc(s) {
    if (s === undefined || s === null) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  var C = {
    ink: '#14201D', line: '#8E9A96', head: '#EDF2EF', meta: '#F2F4F2',
    sub: '#F7F9F8', jade: '#0E5C50', grey: '#4A5754', pale: '#DDE3E1'
  };

  /* ---------- 抬头 ---------- */
  function topBar(f) {
    var mark = '<span style="display:inline-block;width:25px;height:25px;border:1pt solid ' + C.jade + ';' +
      'border-radius:4px;text-align:center;line-height:25px;font-size:7pt;color:' + C.jade + ';' +
      'vertical-align:middle;letter-spacing:-.3px;white-space:nowrap">筑范</span>';
    var blank = '<span style="display:inline-block;border-bottom:.8pt solid #33403C;width:132px;height:9px;' +
      'vertical-align:middle"></span>';

    return '' +
      '<table class="sh-top" style="width:100%;border-collapse:collapse">' +
        '<tr>' +
          '<td style="border-bottom:1.6pt solid ' + C.ink + ';padding:0 0 7px 0;vertical-align:bottom">' +
            mark +
            '<span style="font-size:10.5pt;font-weight:700;letter-spacing:.03em;margin-left:10px;vertical-align:middle">' +
              blank + '<span style="margin-left:5px">装饰工程有限公司</span></span>' +
          '</td>' +
          '<td align="right" width="150" style="border-bottom:1.6pt solid ' + C.ink + ';padding:0 0 7px 0;' +
            'vertical-align:bottom;font-size:8.5pt;color:#444;white-space:nowrap">' +
            '编号：<b style="font-family:Consolas,monospace;letter-spacing:.06em;color:' + C.ink + '">' +
            esc(f.id) + '</b></td>' +
        '</tr>' +
      '</table>';
  }

  function titleBar(f) {
    var sub = f.b ? '依据：' + f.b : '';
    return '<div class="sh-title" style="margin:13px 0 4px;text-align:center;font-size:17pt;font-weight:700;' +
      'letter-spacing:.14em;line-height:1.35">' + esc(f.n) + '</div>' +
      (sub ? '<div class="sh-sub" style="text-align:center;font-size:8.5pt;color:#555;margin-bottom:12px">' +
        esc(sub) + '</div>' : '<div style="height:8px"></div>');
  }

  /* ---------- 头部键值网格（4 列） ---------- */
  function metaTable(m) {
    if (!m || !m.length) return '';
    var rows = '', i;
    for (i = 0; i < m.length; i += 2) {
      var a = m[i], b = m[i + 1];
      rows += '<tr>';
      rows += '<td class="k" style="border:.6pt solid ' + C.line + ';background:' + C.meta +
        ';padding:4px 7px;font-size:9pt;height:24px;width:62px;color:#33403C;white-space:nowrap">' +
        esc(a[0]) + '</td>';
      rows += '<td style="border:.6pt solid ' + C.line + ';padding:4px 7px;font-size:9pt;height:24px">' +
        esc(a[1] || '') + '</td>';
      if (b) {
        rows += '<td class="k" style="border:.6pt solid ' + C.line + ';background:' + C.meta +
          ';padding:4px 7px;font-size:9pt;height:24px;width:62px;color:#33403C;white-space:nowrap">' +
          esc(b[0]) + '</td>';
        rows += '<td style="border:.6pt solid ' + C.line + ';padding:4px 7px;font-size:9pt;height:24px">' +
          esc(b[1] || '') + '</td>';
      } else {
        rows += '<td colspan="2" style="border:.6pt solid ' + C.line + ';padding:4px 7px;"></td>';
      }
      rows += '</tr>';
    }
    return '<table class="sh-meta" style="width:100%;border-collapse:collapse;table-layout:fixed">' + rows + '</table>';
  }

  /* ---------- 区块标题 ---------- */
  function secTitle(t) {
    return '<h2 style="margin:11px 0 0;font-size:9.5pt;font-weight:700;letter-spacing:.06em;color:' + C.ink +
      ';padding:4px 8px;background:' + C.head + ';border-left:2.4pt solid ' + C.jade +
      ';border-top:.6pt solid ' + C.line + ';border-right:.6pt solid ' + C.line + '">' + esc(t) + '</h2>';
  }

  /* ---------- 主表 ---------- */
  function colTable(cols, rows) {
    if (!cols || !cols.length) return '';
    rows = Math.min(Math.max(rows || 6, 1), 20);
    var colgroup = '<colgroup>' + cols.map(function (c) {
      return '<col style="width:' + (c.w || (100 / cols.length) + '%') + '">';
    }).join('') + '</colgroup>';

    var th = '<tr>' + cols.map(function (c) {
      return '<th style="border:.6pt solid ' + C.line + ';background:' + C.sub + ';font-size:8.6pt;' +
        'font-weight:700;padding:4px 5px;text-align:center;letter-spacing:.02em;color:#25332F;height:24px">' +
        esc(c.t) + '</th>';
    }).join('') + '</tr>';

    var body = '';
    for (var r = 0; r < rows; r++) {
      var bg = (r % 2 === 1) ? ';background:#FCFDFC' : '';
      body += '<tr>' + cols.map(function (c) {
        return '<td style="border:.6pt solid ' + C.line + ';height:20px;padding:2px 5px;font-size:8.6pt' + bg + '"></td>';
      }).join('') + '</tr>';
    }
    return '<table class="sh-table" style="width:100%;border-collapse:collapse;table-layout:fixed">' +
      colgroup + '<thead>' + th + '</thead><tbody>' + body + '</tbody></table>';
  }

  /* ---------- 勾选清单 ---------- */
  function checkTable(items) {
    if (!items || !items.length) return '';
    var html = '';
    for (var i = 0; i < items.length; i += 2) {
      var a = items[i], b = items[i + 1];
      html += '<tr>';
      html += '<td style="border:.6pt solid ' + C.line + ';border-top:0;padding:4px 7px;font-size:8.6pt;line-height:1.65;width:50%">' +
        '<span style="color:' + C.grey + ';margin-right:5px">□</span>' + esc(a) + '</td>';
      html += b
        ? '<td style="border:.6pt solid ' + C.line + ';border-top:0;padding:4px 7px;font-size:8.6pt;line-height:1.65">' +
          '<span style="color:' + C.grey + ';margin-right:5px">□</span>' + esc(b) + '</td>'
        : '<td style="border:.6pt solid ' + C.line + ';border-top:0;padding:4px 7px;"></td>';
      html += '</tr>';
    }
    return '<table class="sh-check" style="width:100%;border-collapse:collapse;table-layout:fixed">' + html + '</table>';
  }

  /* ---------- 手写区 ---------- */
  function textArea(lines) {
    lines = Math.min(Math.max(lines || 3, 1), 12);
    var rows = '';
    for (var i = 0; i < lines; i++) {
      rows += '<tr><td style="border:.6pt solid ' + C.line + ';border-top:0;height:19px;' +
        'border-bottom:' + (i === lines - 1 ? '.6pt solid ' + C.line : '.5pt dotted #B4BDB9') + '"></td></tr>';
    }
    return '<table class="sh-text" style="width:100%;border-collapse:collapse"><tbody>' + rows + '</tbody></table>';
  }

  /* ---------- 小键值表 ---------- */
  function kvTable(m) {
    if (!m || !m.length) return '';
    var rows = '';
    for (var i = 0; i < m.length; i += 3) {
      var g = m.slice(i, i + 3);
      rows += '<tr>';
      g.forEach(function (p) {
        rows += '<td style="border:.6pt solid ' + C.line + ';background:' + C.meta + ';padding:4px 7px;' +
          'font-size:9pt;height:24px;width:64px;color:#33403C;white-space:nowrap">' + esc(p[0]) + '</td>';
        rows += '<td style="border:.6pt solid ' + C.line + ';padding:4px 7px;font-size:9pt;height:24px">' +
          esc(p[1] || '') + '</td>';
      });
      for (var k = g.length; k < 3; k++) rows += '<td colspan="2" style="border:.6pt solid ' + C.line + '"></td>';
      rows += '</tr>';
    }
    return '<table style="width:100%;border-collapse:collapse;table-layout:fixed">' + rows + '</table>';
  }

  /* ---------- 区块分发 ---------- */
  function renderSection(sec, cap) {
    var out = secTitle(sec.title || '');
    if (sec.k === 'check') out += checkTable(sec.items);
    else if (sec.k === 'text') out += textArea(sec.h);
    else if (sec.k === 'kv') out += kvTable(sec.m);
    else out += colTable(sec.c, Math.min(sec.rows || 6, cap || 12));
    return '<div class="sh-sec">' + out + '</div>';
  }

  /* ---------- 签字区 ---------- */
  function signBlock(signs) {
    if (!signs || !signs.length) return '';
    var cells = signs.slice();
    var rows = '', i;
    for (i = 0; i < cells.length; i += 2) {
      rows += '<tr>';
      rows += '<td style="padding:11px 0 0 0;font-size:9pt;width:50%;vertical-align:bottom">' +
        '<span>' + esc(cells[i]) + '：</span>' +
        '<span style="display:inline-block;border-bottom:.7pt solid #5C6B66;width:110px;height:16px"></span></td>';
      if (cells[i + 1]) {
        rows += '<td style="padding:11px 0 0 0;font-size:9pt;vertical-align:bottom">' +
          '<span>' + esc(cells[i + 1]) + '：</span>' +
          '<span style="display:inline-block;border-bottom:.7pt solid #5C6B66;width:110px;height:16px"></span></td>';
      } else { rows += '<td></td>'; }
      rows += '</tr>';
    }
    rows += '<tr><td colspan="2" style="padding:11px 0 0 0;font-size:9pt">' +
      '<span>签署日期：</span>' +
      '<span style="display:inline-block;border-bottom:.7pt solid #5C6B66;width:52px;height:16px"></span>' +
      '<span style="margin:0 6px">年</span>' +
      '<span style="display:inline-block;border-bottom:.7pt solid #5C6B66;width:34px;height:16px"></span>' +
      '<span style="margin:0 6px">月</span>' +
      '<span style="display:inline-block;border-bottom:.7pt solid #5C6B66;width:34px;height:16px"></span>' +
      '<span style="margin-left:6px">日</span></td></tr>';
    return '<table class="sh-sign" style="width:100%;border-collapse:collapse;table-layout:fixed;margin-top:4px">' +
      '<tbody>' + rows + '</tbody></table>';
  }

  /* ---------- 备注 ---------- */
  function noteBlock(f) {
    var t = f.note || '';
    var legal = '本表为筑范标准表单，依据现行国家与行业标准编制，供装企内部管理使用。';
    return '<div class="sh-note" style="margin-top:10px;padding-top:6px;border-top:.6pt dashed #A8B2AE;' +
      'font-size:8pt;line-height:1.7;color:' + C.grey + '">' +
      '<b>备注：</b>' + esc(t) + '<br>' +
      '<b>声明：</b>' + legal + '</div>';
  }

  /* ---------- 组装：表单纸面主体 ---------- */
  function sheetBody(f) {
    var h = topBar(f) + titleBar(f);
    if (f.m && f.m.length) h += metaTable(f.m);
    var secs = f.s || [];
    /* 版面自适应：区块越多，主表留白行越少，确保单页 A4 内排版完整 */
    var cap = Math.max(5, 12 - secs.length * 2);
    if (f.c && f.c.length) {
      h += '<div class="sh-sec">' + colTable(f.c, Math.min(f.rows || 6, cap)) + '</div>';
    }
    secs.forEach(function (sec) { h += renderSection(sec, cap); });
    h += signBlock(f.sg);
    h += noteBlock(f);
    return h;
  }

  /* ---------- 网页 A4 纸面 ---------- */
  function sheetHTML(f) {
    return '<article class="sheet" data-id="' + esc(f.id) + '">' + sheetBody(f) +
      '<div class="sh-pagefoot">' +
        '<span>筑范 ZHUFAN · 装修施工管理标准表单</span>' +
        '<span>' + esc(f.id) + ' · V1.0</span>' +
      '</div></article>';
  }

  /* ---------- Word 导出 ---------- */
  var WORD_CSS = ''
    + 'body{font-family:"Microsoft YaHei","PingFang SC",sans-serif;font-size:10.5pt;color:#111;margin:0}'
    + 'table{border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0}'
    + 'td,th{vertical-align:middle}'
    + '.sh-title{font-size:17pt !important;font-weight:bold}'
    + '.sh-sub{font-size:8.5pt !important;color:#555}'
    + '.sh-note b{font-weight:bold}';

  function exportWord(forms, filename) {
    var body = forms.map(function (f, i) {
      var page = sheetBody(f);
      var brk = (i < forms.length - 1) ? '<br clear="all" style="page-break-before:always;mso-special-character:line-break">' : '';
      return page + brk;
    }).join('');

    var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' +
      'xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">' +
      '<head><meta charset="utf-8"><title>' + esc(filename) + '</title>' +
      '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View>' +
      '<w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->' +
      '<style>@page{size:A4;margin:15mm 16mm}' + WORD_CSS + '</style></head>' +
      '<body>' + body + '</body></html>';

    download(new Blob(['\ufeff' + html], { type: 'application/msword;charset=utf-8' }),
      filename + '.doc');
  }

  /* ---------- Excel 导出 ---------- */
  function exportExcel(forms, filename) {
    var parts = forms.map(function (f) {
      var h = '<table border="1" cellspacing="0" style="border-collapse:collapse;font-family:Microsoft YaHei;font-size:10pt">';
      h += '<tr><td colspan="6" style="height:24px;font-size:13pt;font-weight:bold;text-align:center">' +
        esc(f.n) + '</td></tr>';
      h += '<tr><td colspan="6" style="font-size:8pt;color:#666">编号：' + esc(f.id) +
        '　依据：' + esc(f.b || '') + '</td></tr>';
      (f.m || []).forEach(function (p) {
        h += '<tr><td style="background:#F2F4F2;font-weight:bold;width:90px">' + esc(p[0]) + '</td>' +
          '<td colspan="5">' + esc(p[1] || '') + '</td></tr>';
      });
      if (f.c && f.c.length) {
        h += '<tr>' + f.c.map(function (c) { return '<td style="background:#EDF2EF;font-weight:bold;text-align:center">' + esc(c.t) + '</td>'; }).join('') + '</tr>';
        var rows = Math.min(f.rows || 8, 22);
        for (var r = 0; r < rows; r++) {
          h += '<tr>' + f.c.map(function () { return '<td style="height:20px"></td>'; }).join('') + '</tr>';
        }
      }
      (f.s || []).forEach(function (sec) {
        h += '<tr><td colspan="6" style="background:#EDF2EF;font-weight:bold">' + esc(sec.title || '') + '</td></tr>';
        if (sec.k === 'check') {
          for (var i = 0; i < sec.items.length; i += 3) {
            h += '<tr>' + sec.items.slice(i, i + 3).map(function (t) {
              return '<td>□ ' + esc(t) + '</td>';
            }).join('') + '</tr>';
          }
        } else if (sec.k === 'kv') {
          sec.m.forEach(function (p) {
            h += '<tr><td style="background:#F7F9F8">' + esc(p[0]) + '</td><td colspan="5">' + esc(p[1] || '') + '</td></tr>';
          });
        } else if (sec.k === 'text') {
          for (var k = 0; k < (sec.h || 3); k++) h += '<tr><td colspan="6" style="height:20px"></td></tr>';
        } else if (sec.c) {
          h += '<tr>' + sec.c.map(function (c) { return '<td style="background:#F7F9F8;font-weight:bold;text-align:center">' + esc(c.t) + '</td>'; }).join('') + '</tr>';
          for (var r2 = 0; r2 < Math.min(sec.rows || 6, 20); r2++) {
            h += '<tr>' + sec.c.map(function () { return '<td style="height:20px"></td>'; }).join('') + '</tr>';
          }
        }
      });
      if (f.sg && f.sg.length) {
        h += '<tr><td colspan="6" style="background:#EDF2EF;font-weight:bold">签署</td></tr>';
        h += '<tr>' + f.sg.map(function (s) { return '<td style="height:34px">' + esc(s) + '：</td>'; }).join('') +
          '<td style="height:34px">日期：</td></tr>';
      }
      h += '<tr><td colspan="6" style="font-size:8pt;color:#666">备注：' + esc(f.note || '') + '</td></tr>';
      h += '<tr><td colspan="6"></td></tr><tr><td colspan="6"></td></tr>';
      h += '</table>';
      return h;
    });

    var html = '<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8">' +
      '<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>' +
      '<x:Name>标准表单</x:Name><x:WorksheetOptions><x:DisplayGridlines/>' +
      '</x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->' +
      '</head><body>' + parts.join('<br style="page-break-before:always">') + '</body></html>';

    download(new Blob(['\ufeff' + html], { type: 'application/vnd.ms-excel;charset=utf-8' }),
      filename + '.xls');
  }

  /* ---------- 打印 / 存为 PDF ---------- */
  function printForms(forms) {
    var area = document.getElementById('print-area');
    area.innerHTML = forms.map(sheetHTML).join('');
    document.body.classList.add('printing');
    var oldTitle = document.title;
    document.title = forms.length === 1 ? forms[0].n : '筑范标准表单';
    setTimeout(function () {
      global.print();
      setTimeout(function () {
        document.body.classList.remove('printing');
        document.title = oldTitle;
      }, 800);
    }, 150);
  }

  /* ---------- 下载 ---------- */
  function download(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 400);
  }

  global.ZF = {
    esc: esc,
    sheetBody: sheetBody,
    sheetHTML: sheetHTML,
    exportWord: exportWord,
    exportExcel: exportExcel,
    printForms: printForms,
    download: download
  };
})(window);
