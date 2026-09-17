import { StyleSheet } from 'react-native';

// 🌟 Centralized Theme Configuration System
export const colors = {
  bgGradient: ['#103e4b', '#07161b'],   // Fixed to match your premium deep teal layout palette
  glassBg: 'rgba(255, 255, 255, 0.08)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',
  textPrimary: '#ffffff',
  textSecondary: '#94a3b8',
  accent: '#a5f3fc',                   // Active highlight color
};

export const styles = StyleSheet.create({
  // ==========================================
  // 🏢 AUTHENTICATION LAYOUT SYSTEM (Friend's Code)
  // ==========================================
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  glassCard: {
    backgroundColor: colors.glassBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    color: colors.textPrimary,
    marginBottom: 16,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#319795', // Rich system contextual emerald teal accent
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  // ==========================================
  // 📱 MAIN APPLICATION MASTER LAYOUTS (Your Code)
  // ==========================================
  appViewContainer: { flex: 1 },
  appSafeAreaFrame: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 110 },
  
  // Header Elements
  searchHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  searchBarField: { flexDirection: 'row', backgroundColor: colors.glassBg, borderRadius: 14, borderWidth: 1, borderColor: colors.glassBorder, alignItems: 'center', paddingHorizontal: 16, height: 44, flex: 1, marginRight: 16 },
  textInputStyle: { flex: 1, color: colors.textPrimary, fontSize: 14 },
  headerProfileCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  
  screenHeaderContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  screenHeaderWithBack: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  centeredScreenTitle: { fontSize: 15, fontWeight: 'bold', color: colors.textPrimary, letterSpacing: 1 },
  leftAlignedScreenTitle: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary, letterSpacing: 0.5 },
  centeredScreenTitleText: { fontSize: 15, fontWeight: 'bold', color: colors.textPrimary, letterSpacing: 1 },
  
  // Hero Typography
  heroTextGroup: { marginBottom: 25 },
  mainTitleText: { fontSize: 26, fontWeight: 'bold', color: colors.textPrimary, letterSpacing: 0.2 },
  subTitleText: { fontSize: 20, fontWeight: '600', color: colors.textPrimary, marginTop: 4, opacity: 0.95 },
  
  // Feature Panels & Hero Content
  glassCardBase: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.14)', marginBottom: 30 },
  glassCardGradient: { paddingVertical: 45, alignItems: 'center', justifyContent: 'center' },
  locationMarkerFrame: { marginBottom: 12 },
  locationTitleText: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  locationSubText: { color: colors.textSecondary, fontSize: 13, marginTop: 4, fontWeight: '500' },
  
  primaryActionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', padding: 16, justifyContent: 'center' },
  primaryActionBtnText: { color: colors.textPrimary, fontSize: 13, fontWeight: 'bold', letterSpacing: 0.3 },
  
  // Department Grid Engine
  gridContainer: { marginTop: 5 },
  gridRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  gridTile: { width: '47.5%', aspectRatio: 1.15, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', justifyContent: 'center', alignItems: 'center', padding: 12 },
  tileLabelText: { color: '#cbd5e1', fontSize: 12, fontWeight: '600', marginTop: 12, letterSpacing: 0.2 },
  
  // Grievances Summary System
  summaryBannerCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', marginBottom: 25 },
  summaryBannerGradient: { padding: 16, flexDirection: 'row', alignItems: 'center' },
  summaryIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255, 255, 255, 0.06)', alignItems: 'center', justifyContent: 'center' },
  bannerMainTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  bannerSubTitle: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  
  ticketCardBase: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.07)', padding: 18, marginBottom: 16 },
  ticketRefNumber: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
  ticketStatusText: { color: colors.textSecondary, fontSize: 12, marginTop: 2, fontWeight: '500' },
  progressBarTrack: { height: 5, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 3, marginVertical: 14, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  ticketDetailsAddress: { color: '#e2e8f0', fontSize: 13, fontWeight: '500' },
  ticketDateStamp: { color: '#64748b', fontSize: 11, marginTop: 4 },
  
  // Account Specific View Configurations
  profileGlassBanner: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 25 },
  profileBannerGradient: { padding: 16, flexDirection: 'row', alignItems: 'center' },
  profileAvatarFrame: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center' },
  profileNameText: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  profileSubEmail: { color: colors.textSecondary, fontSize: 12, marginTop: 1 },
  
  settingsMenuBox: { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)', paddingHorizontal: 16, paddingVertical: 4 },
  menuRowItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)' },
  menuRowLeft: { flexDirection: 'row', alignItems: 'center' },
  menuItemLabelText: { color: '#cbd5e1', fontSize: 14, fontWeight: '500' },
  
  // Navigation Components
  navigationTabBarBase: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 76, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#07161b', borderTopWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', paddingBottom: 12 },
  tabBarButton: { alignItems: 'center', justifyContent: 'center', flex: 1, paddingTop: 12 },
  tabBarLabelText: { fontSize: 10, marginTop: 4, fontWeight: '600' },
  tabActiveBarPointer: { width: 14, height: 3, backgroundColor: colors.accent, borderRadius: 2, marginTop: 4, position: 'absolute', bottom: -6 }
});