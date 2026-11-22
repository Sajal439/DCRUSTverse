import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { apiRequest } from '../api/client';
import { WorkspaceForm } from '../components/WorkspaceForm';
import { RecordDetails } from './ResourceScreen';
import type { Field, RecordData } from '../types/workspace';
import { useAuth } from '../contexts/AuthContext';
import { loadRecords, recordTitle } from '../services/workspace';

export function LiveAssistantScreen() {
  const [answer, setAnswer] = useState<RecordData | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const ask = async (data: RecordData) => {
    setBusy(true); setError(''); setAnswer(null);
    try { setAnswer(await apiRequest<RecordData>('/ai/assistant', { method: 'POST', body: JSON.stringify(data) })); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not get an answer'); }
    finally { setBusy(false); }
  };
  return <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Text style={styles.title}>Campus assistant</Text><Text style={styles.description}>Answers are drawn from the server’s campus information. Check the sources; missing information will not be replaced by sample answers.</Text>
    <WorkspaceForm fields={[{ key: 'query', label: 'Your question', kind: 'multiline', required: true, min: 3, max: 1000 }]} label="Ask assistant" busy={busy} onSubmit={ask} />
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    {!!answer && <View style={styles.card}><Text selectable style={styles.answer}>{String(answer.answer ?? '')}</Text><RecordDetails data={answer} columns={['sources', 'missingInformationAcknowledged']} /></View>}
  </ScrollView>;
}

export function LiveDigitalIdScreen() {
  const [card, setCard] = useState<RecordData | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  const load = async (renew = false) => {
    setBusy(true); setError(''); setCard(null);
    try { setCard(await apiRequest<RecordData>(renew ? '/digital-id/issue' : '/digital-id/me', { method: renew ? 'POST' : 'GET' })); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not load digital ID'); }
    finally { setBusy(false); }
  };
  useEffect(() => { void load(); const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const remaining = card ? Math.max(0, Math.floor((Date.parse(String(card.expiresAt)) - now) / 1000)) : 0;
  const active = card?.status === 'active' && remaining > 0;
  return <ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.title}>My digital ID</Text>
    <Text style={styles.description}>This credential comes from your campus account. A verifier must check the current server status; a screenshot is not proof of validity.</Text>
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    {busy && <ActivityIndicator />}
    {!!card && <View style={styles.card}>
      <Text style={styles.title}>{String(card.fullName)}</Text>
      <RecordDetails data={card} columns={['rollNumber', 'departmentName', 'credentialNumber', 'roles', 'expiresAt']} />
      <Text style={active ? styles.success : styles.error}>{active ? `Expires in ${remaining} seconds` : card.status === 'revoked' ? 'Revoked — contact the campus administrator' : 'Expired — renew before verification'}</Text>
      {active && <View accessibilityLabel="QR code containing the current digital ID verification token" style={{ alignItems: 'center', padding: 16 }}><QRCode value={String(card.verificationToken)} size={200} /></View>}
    </View>}
    <Pressable accessibilityRole="button" disabled={busy} style={styles.button} onPress={() => void load(!!card && card.status !== 'revoked' && !active)}><Text style={styles.buttonText}>{card && card.status !== 'revoked' && !active ? 'Renew expired credential' : 'Refresh credential'}</Text></Pressable>
  </ScrollView>;
}

export function RollCallScreen() {
  const { user } = useAuth();
  const [session, setSession] = useState<RecordData | null>(null);
  const [roster, setRoster] = useState<RecordData[]>([]);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const request = useRef(0);
  const isAdmin = user?.roles?.some(role => role.role === 'administrator' && role.scopeType === 'global');
  const load = async (values: RecordData) => {
    const version = ++request.current;
    setBusy(true); setError(''); setMessage(''); setRoster([]); setSession(null);
    try {
      const sessions = await loadRecords(`/timetable/sessions${isAdmin ? '' : `?facultyId=${encodeURIComponent(user?.id ?? '')}`}`);
      const selected = sessions.find(row => row.id === values.sessionId);
      if (!selected) throw new Error('This session is no longer available.');
      const students = await loadRecords(`/academics/sections/${encodeURIComponent(String(selected.sectionId))}/roster`);
      if (version !== request.current) return;
      setSession(selected); setRoster(students); setMarks({});
    } catch (err) { if (version === request.current) setError(err instanceof Error ? err.message : 'Could not load class'); }
    finally { if (version === request.current) setBusy(false); }
  };
  const save = async () => {
    if (!session || busy) return;
    if (roster.some(student => !marks[String(student.studentId)])) { setError('Mark every student before saving.'); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      await apiRequest('/attendance/record', { method: 'POST', body: JSON.stringify({ sessionId: session.id, records: roster.map(student => ({ studentId: student.studentId, status: marks[String(student.studentId)] })) }) });
      setMessage('Attendance saved on the campus server.'); setRoster([]); setSession(null);
    } catch (err) { setError(err instanceof Error ? err.message : 'Attendance was not saved'); }
    finally { setBusy(false); }
  };
  return <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Text style={styles.title}>Record attendance</Text><Text style={styles.description}>Choose a scheduled session and mark each enrolled student. The server rejects duplicate session records.</Text>
    <WorkspaceForm fields={[{ key: 'sessionId', label: 'Class session', kind: 'reference', required: true, source: `/timetable/sessions${isAdmin ? '' : `?facultyId=${encodeURIComponent(user?.id ?? '')}`}` }]} label="Load class roster" busy={busy} onSubmit={load} />
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}{!!message && <Text accessibilityLiveRegion="polite" style={styles.success}>{message}</Text>}
    {!!session && !roster.length && <Text style={styles.description}>No enrolled students in this class.</Text>}
    {roster.map(student => <View key={String(student.studentId)} style={styles.card}><Text style={styles.cardTitle}>{String(student.displayName)}</Text><Text>{String(student.rollNumber ?? '')}</Text><View style={styles.row}>{['present', 'absent', 'late', 'excused'].map(status => <Pressable accessibilityRole="radio" accessibilityState={{ checked: marks[String(student.studentId)] === status }} key={status} style={[styles.chip, marks[String(student.studentId)] === status && styles.chosen]} onPress={() => setMarks(previous => ({ ...previous, [String(student.studentId)]: status }))}><Text style={marks[String(student.studentId)] === status ? styles.buttonText : styles.description}>{status}</Text></Pressable>)}</View></View>)}
    {!!roster.length && <Pressable accessibilityRole="button" disabled={busy} style={styles.button} onPress={() => void save()}><Text style={styles.buttonText}>{busy ? 'Saving…' : 'Save attendance'}</Text></Pressable>}
  </ScrollView>;
}

export function SurveyScreen() {
  const { user } = useAuth();
  const canPublish = user?.roles?.some(role => ['administrator', 'department_head', 'faculty'].includes(role.role)) ?? false;
  const [authoring, setAuthoring] = useState(false);
  const [questionCount, setQuestionCount] = useState(1);
  const [aggregation, setAggregation] = useState<RecordData | null>(null);
  const [surveys, setSurveys] = useState<RecordData[]>([]);
  const [selected, setSelected] = useState<RecordData | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const load = () => { setError(''); void loadRecords('/surveys').then(setSurveys).catch(err => setError(err instanceof Error ? err.message : 'Could not load surveys')); };
  useEffect(load, []);
  const open = async (survey: RecordData) => {
    setBusy(true); setError(''); setMessage('');
    try { setAggregation(null); setSelected(await apiRequest<RecordData>(`/surveys/${encodeURIComponent(String(survey.id))}`)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not open survey'); }
    finally { setBusy(false); }
  };
  const questions = (selected?.questions ?? []) as RecordData[];
  const fields: Field[] = questions.map(question => ({ key: String(question.id), label: String(question.questionText), required: true, kind: question.questionType === 'multiple_choice' ? 'select' : 'multiline', options: question.options as string[] }));
  const submit = async (data: RecordData) => {
    if (!selected || busy) return;
    setBusy(true); setError('');
    try {
      await apiRequest(`/surveys/${encodeURIComponent(String(selected.id))}/responses`, { method: 'POST', body: JSON.stringify({ answers: Object.entries(data).map(([questionId, responseText]) => ({ questionId, responseText })) }) });
      setMessage('Your response was saved.'); setSelected(null);
    } catch (err) { setError(err instanceof Error ? err.message : 'Response was not saved'); }
    finally { setBusy(false); }
  };
  const publish = async (data: RecordData) => {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const questions = Array.from({ length: questionCount }, (_, index) => ({ questionText: data[`question${index}`], questionType: data[`type${index}`], options: String(data[`options${index}`] ?? '').split(',').map(option => option.trim()).filter(Boolean) }));
      if (questions.some(question => question.questionType === 'multiple_choice' && question.options.length < 2)) throw new Error('Each multiple-choice question needs at least two options.');
      await apiRequest('/surveys', { method: 'POST', body: JSON.stringify({ title: data.title, description: data.description, startsAt: data.startsAt, endsAt: data.endsAt, isAnonymous: data.isAnonymous === true, questions }) });
      setAuthoring(false); setQuestionCount(1); setMessage('Survey published on the campus server.'); load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Survey was not published'); }
    finally { setBusy(false); }
  };
  if (authoring) return <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Pressable accessibilityRole="button" disabled={busy} onPress={() => setAuthoring(false)}><Text style={styles.link}>‹ Cancel survey</Text></Pressable>
    <Text style={styles.title}>Create survey</Text><Text style={styles.description}>Choose whether answers are anonymous. Participation is recorded separately to prevent duplicate responses.</Text>
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    <WorkspaceForm fields={[
      { key: 'isAnonymous', label: 'Anonymous answers', kind: 'boolean' }, { key: 'title', label: 'Survey title', required: true, min: 3, max: 200 },
      { key: 'description', label: 'Description', kind: 'multiline' },
      { key: 'startsAt', label: 'Opens (YYYY-MM-DDTHH:mm)', kind: 'datetime', required: true },
      { key: 'endsAt', label: 'Closes (YYYY-MM-DDTHH:mm)', kind: 'datetime', required: true },
      ...Array.from({ length: questionCount }, (_, index): Field[] => [
        { key: `question${index}`, label: `Question ${index + 1}`, required: true, min: 2, max: 500 },
        { key: `type${index}`, label: 'Answer type', kind: 'select', options: ['text', 'multiple_choice'], required: true },
        { key: `options${index}`, label: 'Options for multiple choice (comma separated)' },
      ]).flat(),
    ]} label="Publish survey" busy={busy} onSubmit={publish} />
    {questionCount < 20 && <Pressable accessibilityRole="button" onPress={() => setQuestionCount(count => count + 1)}><Text style={styles.link}>＋ Add another question</Text></Pressable>}
  </ScrollView>;
  return <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><Text style={styles.title}>Surveys & feedback</Text>
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}{!!message && <Text style={styles.success}>{message}</Text>}
    {busy && <ActivityIndicator />}
    {canPublish && !selected && <Pressable accessibilityRole="button" style={styles.button} onPress={() => { setAuthoring(true); setError(''); }}><Text style={styles.buttonText}>Create survey</Text></Pressable>}
    {selected && canPublish && <Pressable accessibilityRole="button" onPress={() => { setError(''); void apiRequest<RecordData>(`/surveys/${selected.id}/results`).then(setAggregation).catch(err => setError(err instanceof Error ? err.message : 'Could not load results')); }}><Text style={styles.link}>View survey results</Text></Pressable>}
    {selected && aggregation && <View style={styles.card}><RecordDetails data={aggregation} /></View>}
    {selected ? <><Pressable onPress={() => setSelected(null)}><Text style={styles.link}>‹ Back to surveys</Text></Pressable><Text style={styles.cardTitle}>{recordTitle(selected)}</Text><Text style={styles.description}>{String(selected.description ?? '')}</Text><Text style={styles.description}>{selected.isAnonymous ? 'This survey is configured as anonymous.' : 'Your response is linked to your campus account.'}</Text><WorkspaceForm key={String(selected.id)} fields={fields} label="Submit response" busy={busy} onSubmit={submit} /></> : <>
      <Pressable accessibilityRole="button" onPress={load}><Text style={styles.link}>Refresh surveys</Text></Pressable>
      {!surveys.length && !error && <Text style={styles.description}>No surveys are available.</Text>}
      {surveys.map(survey => <Pressable key={String(survey.id)} accessibilityRole="button" disabled={busy} style={styles.card} onPress={() => void open(survey)}><Text style={styles.cardTitle}>{recordTitle(survey)}</Text><RecordDetails data={survey} columns={['description', 'startsAt', 'endsAt']} /></Pressable>)}
    </>}
  </ScrollView>;
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 18, flexGrow: 1, backgroundColor: '#F3F6FC' }, title: { fontSize: 26, color: '#17263D', fontWeight: '800' }, description: { color: '#52627A', lineHeight: 22, fontSize: 14 },
  card: { padding: 20, gap: 14, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#DCE4F0' }, cardTitle: { fontSize: 18, color: '#17263D', fontWeight: '700' }, answer: { color: '#17263D', fontSize: 16, lineHeight: 25 },
  error: { color: '#A32020', lineHeight: 22 }, success: { color: '#12643A', lineHeight: 22 }, button: { padding: 16, backgroundColor: '#2448A6', borderRadius: 10 }, buttonText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#B7C4D6' }, chosen: { backgroundColor: '#2448A6' }, link: { color: '#2448A6', fontWeight: '700', paddingVertical: 12 },
});
