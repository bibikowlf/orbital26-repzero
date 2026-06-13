import { StyleSheet } from 'react-native'

export const appStyles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
  },
  mt20: {
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#86939e',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#86939e',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  inputDisabled: {
    backgroundColor: '#f2f2f2',
    borderColor: '#d1d1d1',
    color: '#9e9e9e',
  },
  button: {
    backgroundColor: '#2089dc',
    borderRadius: 4,
    padding: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  avatar: {
    borderRadius: 5,
    overflow: 'hidden',
    maxWidth: '100%',
    marginBottom: 20,
  },
  image: {
    objectFit: 'cover',
    paddingTop: 0,
  },
  noImage: {
    backgroundColor: '#333',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgb(200, 200, 200)',
    borderRadius: 5,
  },
  link: {
    marginVertical: 10,
    borderBottomWidth: 1,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  actionButton: {
    flex: 0.48,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  dayHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
    paddingBottom: 4,
  },
  exerciseRow: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: '#ced4da',
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212529',
  },
  exerciseMeta: {
    fontSize: 13,
    color: '#495057',
    marginTop: 2,
  },
  exerciseNotes: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
    marginTop: 4,
  },
  miniLabel: {
    fontSize: 11,
    color: '#6c757d',
    fontWeight: '600',
    marginBottom: 2,
  },
  inlineInput: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14,
    backgroundColor: '#fafafa',
  },
  fallbackText: {
    color: '#868e96',
    textAlign: 'center',
    marginTop: 40,
  },
  inputContainer: {
    marginBottom: 15,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 6,
  },
  dropdown: {
    height: 48,
    borderColor: '#ced4da',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  placeholderStyle: {
    fontSize: 16,
    color: '#adb5bd',
  },
  selectedTextStyle: {
    fontSize: 16,
    color: '#212529',
  },

  // Exercise Log screen
  logContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  logTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#212529',
  },
  logDate: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 16,
  },
  exerciseCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  logInput: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 6,
    padding: 8,
    marginBottom: 6,
    fontSize: 14,
    color: '#212529',
    backgroundColor: '#fff',
  },
  smallInput: {
    flex: 1,
    marginHorizontal: 3,
  },
  inputRow: {
    flexDirection: 'row',
  },
  removeText: {
    color: '#dc3545',
    fontSize: 13,
    marginTop: 4,
  },
  addExerciseButton: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  addExerciseText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  saveLogButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 32,
  },
  saveLogText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  // calender in exercise log
  calendarStrip: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    width: '100%',
    marginVertical: 14,
    backgroundColor: '#f1f3f5',
    padding: 8,
    borderRadius: 12
  },
  calendarCard: { 
    flex: 1, 
    alignItems: 'center', 
    paddingVertical: 10, 
    justifyContent: 'center',
    borderRadius: 8,
    marginHorizontal: 2,
    minHeight: 50
  },
  selectedCard: { 
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  calendarLabel: { 
    fontSize: 11, 
    color: '#6c757d', 
    fontWeight: '600', 
    marginBottom: 4 
  },
  calendarDayNum: { 
    fontSize: 15, 
    fontWeight: '700', 
    color: '#212529' 
  },
  selectedText: { 
    color: '#fff' 
  },

  //import button in exercise log
  importButton: {
    borderWidth: 1,
    borderColor: '#5856D6',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  importButtonText: {
    color: '#5856D6',
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  planDayCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  planDayTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  planDayMeta: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  planExerciseItem: {
    fontSize: 13,
    color: '#495057',
    marginBottom: 3,
  },
  importConfirmButton: {
    marginTop: 12,
    backgroundColor: '#5856D6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  importConfirmText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: 8,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#f1f3f5',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  /*
 container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  date: { fontSize: 14, color: '#666', marginBottom: 16 },
  exerciseCard: { backgroundColor: '#7b9ec1', borderRadius: 8, padding: 12, marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ced4da', borderRadius: 6, padding: 8, marginBottom: 6, fontSize: 14 },
  small: { flex: 1, marginHorizontal: 3 },
  row: { flexDirection: 'row' },
  remove: { color: 'red', fontSize: 13, marginTop: 4 },
  addButton: { borderWidth: 1, borderColor: '#007AFF', borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 12 },
  addButtonText: { color: '#007AFF', fontWeight: '600' },
  saveButton: { backgroundColor: '#007AFF', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 32 },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },*/
})