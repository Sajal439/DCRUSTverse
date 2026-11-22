import { chooseAttachment } from '../services/files';

import React, { useEffect, useState } from 'react';

import { View, Text, TextInput, Pressable, Switch, ActivityIndicator, StyleSheet } from 'react-native';

import type { Field, RecordData } from '../types/workspace';

import { loadRecords, pathWithValues, recordTitle } from '../services/workspace';

import { formSchema } from '../schemas/workspace';



function InputField({ field, value, onChange, context, onBusy }: { field: Field; value: unknown; onChange: (value: unknown) => void; context: RecordData; onBusy: (busy: boolean) => void }) {

  const [options, setOptions] = useState<RecordData[]>([]);

  const [error, setError] = useState('');

  const [busy, setBusy] = useState(false);

  const [query, setQuery] = useState('');

  const [attempt, setAttempt] = useState(0);

  let source = '';

  try { source = field.source ? pathWithValues(field.source, context) : ''; } catch { /* A parent selection is required. */ }

  useEffect(() => {

    if (!source) return;

    let current = true;

    setBusy(true); setError('');

    loadRecords(source).then(data => { if (current) setOptions(data); })

      .catch(err => { if (current) setError(err instanceof Error ? err.message : 'Could not load choices'); })

      .finally(() => { if (current) setBusy(false); });

    return () => { current = false; };

  }, [source, attempt]);

  if (field.kind === 'file') return <View style={styles.choices}>

    <Pressable disabled={busy} onPress={async () => { setBusy(true); onBusy(true); setError(''); try { const file = await chooseAttachment(); if (file) onChange(file.fileUrl); } catch (error) { setError(error instanceof Error ? error.message : 'Upload failed'); } finally { setBusy(false); onBusy(false); } }}><Text style={styles.link}>{busy ? 'Uploading…' : value ? 'Replace attachment' : 'Choose PDF, image or text (up to 2 MB)'}</Text></Pressable>

    {!!value && <Text>Private attachment uploaded</Text>}{!!error && <Text style={styles.error}>{error}</Text>}

  </View>;

  if (field.kind === 'boolean') return <Switch accessibilityLabel={field.label} value={value === true} onValueChange={onChange} />;

  if (field.kind === 'select' || field.kind === 'reference') {

    const choices = field.kind === 'select'

      ? (field.options ?? []).map(option => ({ value: option, label: option.replaceAll('_', ' ') }))

      : options.map(row => ({ value: String(row.id), label: `${recordTitle(row)}${row.code ? ` · ${row.code}` : ''}${row.email ? ` · ${row.email}` : ''}` }));

    const filtered = choices.filter(item => item.label.toLowerCase().includes(query.toLowerCase()));

    return <View style={styles.choices}>

      {field.kind === 'reference' && <TextInput accessibilityLabel={`Search ${field.label}`} style={styles.input} placeholder="Search choices" value={query} onChangeText={setQuery} />}

      {busy && <ActivityIndicator />}

      {!!error && <><Text accessibilityRole="alert" style={styles.error}>{error}</Text><Pressable accessibilityRole="button" onPress={() => setAttempt(x => x + 1)}><Text style={styles.link}>Retry choices</Text></Pressable></>}

      {!busy && !error && !choices.length && <Text style={styles.hint}>No choices available. The corresponding campus records must be created first.</Text>}

      {filtered.slice(0, 100).map(item => <Pressable key={item.value} accessibilityRole="radio" accessibilityState={{ checked: value === item.value }} onPress={() => onChange(item.value)} style={[styles.choice, value === item.value && styles.selected]}><Text style={value === item.value ? styles.selectedText : styles.text}>{item.label}</Text></Pressable>)}

    </View>;

  }

  return <TextInput accessibilityLabel={field.label} style={[styles.input, field.kind === 'multiline' && styles.multiline]} value={String(value ?? '')} onChangeText={onChange} multiline={field.kind === 'multiline'} keyboardType={field.kind === 'number' ? 'decimal-pad' : 'default'} autoCapitalize="none" placeholder={field.kind === 'datetime' ? 'YYYY-MM-DDTHH:mm' : field.label} />;

}



export function WorkspaceForm({ fields, initial = {}, label, busy = false, onSubmit }: { fields: Field[]; initial?: RecordData; label: string; busy?: boolean; onSubmit: (data: RecordData) => void }) {

  const [uploading, setUploading] = useState(false);
  const [values, setValues] = useState<RecordData>(() => ({ ...Object.fromEntries(fields.filter(f => f.kind === 'boolean').map(f => [f.key, false])), ...initial }));

  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = () => {

    if (busy || uploading) return;
    const parsed = formSchema(fields).safeParse(values);

    if (!parsed.success) {

      setErrors(Object.fromEntries(parsed.error.issues.map(issue => [String(issue.path[0]), issue.message])));

      return;

    }

    setErrors({}); onSubmit(parsed.data);

  };

  return <View style={styles.form}>

    {fields.map(field => <View key={field.key} style={styles.field}>

      <Text style={styles.label}>{field.label}{field.required ? ' *' : ''}</Text>

      {!!field.hint && <Text style={styles.hint}>{field.hint}</Text>}

      <InputField onBusy={setUploading} field={field} value={values[field.key]} context={values} onChange={value => setValues(previous => ({ ...previous, [field.key]: value }))} />

      {!!errors[field.key] && <Text accessibilityRole="alert" style={styles.error}>{errors[field.key]}</Text>}

    </View>)}

    <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy }} disabled={busy || uploading} style={[styles.button, busy && { opacity: 0.5 }]} onPress={submit}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.selectedText}>{label}</Text>}</Pressable>

  </View>;

}



const styles = StyleSheet.create({

  form: { gap: 18 }, field: { gap: 7 }, label: { color: '#17263D', fontWeight: '700', fontSize: 15 },

  input: { borderWidth: 1, borderColor: '#B7C4D6', backgroundColor: '#fff', borderRadius: 10, padding: 13, color: '#17263D', fontSize: 15, minHeight: 48 },

  multiline: { minHeight: 110, textAlignVertical: 'top' }, hint: { color: '#52627A', fontSize: 13, lineHeight: 19 }, error: { color: '#A32020', fontSize: 14 },

  choices: { gap: 7 }, choice: { padding: 12, borderWidth: 1, borderColor: '#D8E0EC', borderRadius: 9, minHeight: 44 }, selected: { backgroundColor: '#2448A6', borderColor: '#2448A6' },

  text: { color: '#17263D' }, selectedText: { color: '#fff', fontWeight: '700', textAlign: 'center' }, link: { color: '#2448A6', padding: 12 },

  button: { backgroundColor: '#2448A6', padding: 15, borderRadius: 10, minHeight: 48 },

});

