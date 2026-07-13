import { StyleSheet } from 'react-native'

export const appStyles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'stretch',
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
    //width: '100%',
    flex: 1,
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

  //calender arrow
  arrowButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
arrowText: {
  fontSize: 28,
  color: '#007AFF',
  fontWeight: '300',
},

//month and year toggle
monthCard: {
  width: '30%',
  padding: 12,
  borderRadius: 8,
  alignItems: 'center',
  marginBottom: 10,
  backgroundColor: '#f1f3f5',
},
monthCardSelected: {
  backgroundColor: '#007AFF',
},
monthText: {
  fontSize: 14,
  fontWeight: '600',
  color: '#333',
},
monthTextSelected: {
  color: '#fff',
},
row: {
  flexDirection: "row", 
  alignItems: "center", 
  marginBottom: 10,
},

//community - events log

card: {
  backgroundColor: '#fff',
  borderRadius: 12,
  padding: 16,
  marginBottom: 14,
  borderWidth: 1,
  borderColor: '#e9ecef',
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 2,
},

cardHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
},

categoryBadge: {
  borderRadius: 6,
  paddingHorizontal: 8,
  paddingVertical: 3,
},

categoryText: {
  color: '#fff',
  fontSize: 11,
  fontWeight: '700',
},

spotsText: {
  fontSize: 12,
  color: '#888',
},

title: {
  fontSize: 16,
  fontWeight: '700',
  color: '#212529',
  marginBottom: 4,
},

description: {
  fontSize: 13,
  color: '#666',
  marginBottom: 10,
},

metaRow: {
  marginBottom: 3,
},

metaText: {
  fontSize: 12,
  color: '#495057',
},

cardFooter: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 12,
},

hostText: {
  fontSize: 12,
  color: '#888',
},

rsvpBadge: {
  borderWidth: 1.5,
  borderColor: '#007AFF',
  borderRadius: 8,
  paddingHorizontal: 14,
  paddingVertical: 6,
},

rsvpBadgeActive: {
  backgroundColor: '#007AFF',
},

rsvpBadgeText: {
  fontSize: 13,
  fontWeight: '600',
  color: '#007AFF',
},

rsvpBadgeTextActive: {
  color: '#fff',
},

fab: {
  position: 'absolute',
  bottom: 24,
  right: 24,
  backgroundColor: '#007AFF',
  width: 56,
  height: 56,
  borderRadius: 28,
  justifyContent: 'center',
  alignItems: 'center',
  shadowColor: '#000',
  shadowOpacity: 0.2,
  shadowRadius: 6,
  elevation: 5,
},

fabText: {
  color: '#fff',
  fontSize: 28,
  fontWeight: '300',
  lineHeight: 32,
},  

// create-event

label: { 
  fontSize: 13, 
  fontWeight: '600', 
  color: '#333', 
  marginBottom: 6, 
  marginTop: 14 
},

input: { 
  borderWidth: 1, 
  borderColor: '#ccc', 
  borderRadius: 8, 
  padding: 10, 
  fontSize: 14, 
  color: '#212529' 
},

submitButton: { 
  marginTop: 24, 
  backgroundColor: '#007AFF', 
  borderRadius: 8, 
  padding: 14, 
  alignItems: 'center' 
},

submitText: { 
  color: '#fff', 
  fontWeight: '700', 
  fontSize: 15 
},

//category in create event
categoryRow: { 
  flexDirection: 'row', 
  flexWrap: 'wrap', 
  gap: 8 
},

categoryChip: { 
  borderWidth: 1, 
  borderColor: '#ccc', 
  borderRadius: 20, 
  paddingHorizontal: 14, 
  paddingVertical: 6 
},

categoryChipActive: { 
  backgroundColor: '#007AFF', 
  borderColor: '#007AFF' 
},

categoryChipText: { 
  fontSize: 13, 
  color: '#333' 
},

categoryChipTextActive: { 
  color: '#fff' 
},

// event details page

categoryBadge: {
  alignSelf: 'flex-start',
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 12,
  marginBottom: 12,
},

categoryText: {
  color: '#fff',
  fontSize: 12,
  fontWeight: '700',
},

title: {
  fontSize: 22,
  fontWeight: '800',
  color: '#1a1a1a',
  marginBottom: 4,
},

host: {
  fontSize: 13,
  color: '#888',
  marginBottom: 16,
},

infoBox: {
  backgroundColor: '#f8f9fa',
  borderRadius: 12,
  padding: 14,
  marginBottom: 20,
  gap: 10,
},

infoRow: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: 10,
},

infoIcon: {
  fontSize: 15,
},

infoText: {
  fontSize: 14,
  color: '#333',
  flex: 1,
},

sectionLabel: {
  fontSize: 13,
  fontWeight: '700',
  color: '#888',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
},

description: {
  fontSize: 15,
  color: '#333',
  lineHeight: 22,
  marginBottom: 28,
},

rsvpButton: {
  backgroundColor: '#f1f3f5',
  borderRadius: 12,
  padding: 16,
  alignItems: 'center',
  marginBottom: 12,
},

rsvpButtonActive: {
  backgroundColor: '#34C759',
},

rsvpButtonDisabled: {
  backgroundColor: '#e9ecef',
  opacity: 0.6,
},

rsvpButtonText: {
  fontSize: 16,
  fontWeight: '700',
  color: '#333',
},

rsvpButtonTextActive: {
  color: '#fff',
},

creatorBadge: {
  backgroundColor: '#f0f0ff',
  borderRadius: 12,
  padding: 14,
  alignItems: 'center',
},

creatorBadgeText: {
  color: '#5856D6',
  fontWeight: '600',
},

//my event details
categoryBadge: {
  alignSelf: 'flex-start',
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 12,
  marginBottom: 12,
},

categoryText: {
  color: '#fff',
  fontSize: 12,
  fontWeight: '700',
},

title: {
  fontSize: 22,
  fontWeight: '800',
  color: '#1a1a1a',
  marginBottom: 16,
},

infoBox: {
  backgroundColor: '#f8f9fa',
  borderRadius: 12,
  padding: 14,
  marginBottom: 20,
  gap: 10,
},

infoRow: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: 10,
},

infoIcon: {
  fontSize: 15,
},

infoText: {
  fontSize: 14,
  color: '#333',
  flex: 1,
},

sectionLabel: {
  fontSize: 13,
  fontWeight: '700',
  color: '#888',
  marginBottom: 10,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
},

description: {
  fontSize: 15,
  color: '#333',
  lineHeight: 22,
  marginBottom: 28,
},

emptyText: {
  color: '#888',
  fontSize: 14,
  marginBottom: 20,
},

attendeeRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  paddingVertical: 10,
  borderBottomWidth: 1,
  borderBottomColor: '#f1f3f5',
},

avatarCircle: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: '#5856D6',
  justifyContent: 'center',
  alignItems: 'center',
},

avatarText: {
  color: '#fff',
  fontWeight: '700',
  fontSize: 14,
},

attendeeUsername: {
  fontSize: 15,
  color: '#333',
  fontWeight: '500',
},

//exercise log tab
tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e9ecef' },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabButtonActive: { borderBottomWidth: 2, borderBottomColor: '#007AFF' },
  tabText: { fontSize: 15, fontWeight: '600', color: '#8E8E93' },
  tabTextActive: { color: '#007AFF' },

//friends tab
chatButton: {
  width: '20%',
  height: 20,
  backgroundColor: '#34C759',
  borderRadius: 8,
  justifyContent: 'center',
  alignItems: 'center',
},

invitesButton: {
  width: '50%',
  height: 20,
  backgroundColor: '#5856D6',
  borderRadius: 8,
  justifyContent: 'center',
  alignItems: 'center',
},

flexOne: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  messageListContent: {
    paddingHorizontal: 15,
    paddingVertical: 12
  },
  messageBubble: {
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 4,
    maxWidth: '75%'
  },
  messageBubbleMine: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF'
  },
  messageBubbleTheirs: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5E5'
  },
  messageTextMine: {
    color: '#fff'
  },
  messageTextTheirs: {
    color: '#000'
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5'
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8
  },
  sendButton: {
    paddingHorizontal: 16,
    backgroundColor: '#007AFF'
  },
  //sending invites

  inviteButton: {
    marginHorizontal: 15,
    marginBottom: 8,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#5856D6',
    borderRadius: 8
  },
  inviteButtonText: {
    color: '#fff',
    fontWeight: '600'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  modalNoteInput: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    minHeight: 60,
    textAlignVertical: 'top'
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15
  },
  modalCancelText: {
    color: '#666',
    marginRight: 20
  },
  modalSendText: {
    color: '#007AFF',
    fontWeight: 'bold'
  },

  dateButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 10,
    alignItems: 'center'
  },
  dateButtonText: {
    fontSize: 16,
    color: '#000'
  },
  datePicker: {
    backgroundColor: '#fff',
    width: '100%'
  },
  inviteCard: {
  borderRadius: 14,
  paddingVertical: 10,
  paddingHorizontal: 14,
  marginVertical: 4,
  maxWidth: '80%'
},
inviteCardTitle: {
  fontWeight: 'bold',
  fontSize: 15
},
  metricsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
    marginTop: 10,
    width: '100%',
  },

  metricItem: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'column',
  },

  metricNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
  },

  metricLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 3,
    fontWeight: '500',
  },

  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E7EB',
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    width: '100%',
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },

  addButton: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },

  addButtonText: {
    color: '#4F46E5',
    fontWeight: '600',
    fontSize: 13,
  },

  chatRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
    alignSelf: 'stretch', 
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },

  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },

  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },

  chatHeaderLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
    width: '100%', 
  },

  usernameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },

  timeText: {
    fontSize: 11,
    color: '#9CA3AF',
  },

  previewText: {
    fontSize: 14,
    color: '#6B7280',
  },
})