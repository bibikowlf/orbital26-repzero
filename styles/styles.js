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
})