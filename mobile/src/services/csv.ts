export function parseCsv(input: string): Record<string, string>[] {
  if (input.length > 90000) throw new Error('Use a CSV smaller than 90 KB.');
  const rows: string[][] = []; let row: string[] = []; let field = ''; let quoted = false;
  const source = input.replace(/^\uFEFF/, '');
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === '"') {
      if (quoted && source[i + 1] === '"') { field += '"'; i++; }
      else if (quoted || field === '') quoted = !quoted;
      else throw new Error('Invalid quote in CSV.');
    } else if (c === ',' && !quoted) { row.push(field); field = ''; }
    else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && source[i + 1] === '\n') i++;
      row.push(field); if (row.some(value => value.trim())) rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (quoted) throw new Error('CSV contains an unclosed quoted value.');
  row.push(field); if (row.some(value => value.trim())) rows.push(row);
  const headers = rows.shift()?.map(value => value.trim()) ?? [];
  if (!headers.includes('email') || !headers.includes('displayName') || new Set(headers).size !== headers.length) throw new Error('CSV needs unique email and displayName headers. Optional: departmentCode, role.');
  if (!rows.length || rows.length > 200) throw new Error('Import between 1 and 200 rows at a time.');
  return rows.map((values, index) => {
    if (values.length !== headers.length) throw new Error(`Row ${index + 2} has the wrong number of columns.`);
    return Object.fromEntries(headers.flatMap((key, i) => values[i]?.trim() ? [[key, values[i].trim()]] : []));
  });
}
