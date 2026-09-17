import React from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // 🎯 Import storage engine
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/globalStyles';

export default function DepartmentsScreen({ navigate, navigation }) {
  
  const handleDeptPress = async (deptId, deptName) => {
    try {
      // 🎯 Save the selected department name locally before changing screens
      await AsyncStorage.setItem('SELECTED_DEPT_NAME', deptName);
    } catch (error) {
      console.error("Storage error:", error);
    }

    if (navigation && navigation.navigate) {
      navigation.navigate('department-feed', { categoryId: deptId, categoryName: deptName });
    } else if (navigate) {
      navigate('department-feed'); // Clean plain string switch that your custom router loves!
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <View style={styles.screenHeaderWithBack}>
        <Text style={styles.centeredScreenTitle}>DEPARTMENTS</Text>
        <TouchableOpacity style={styles.headerProfileCircle}>
          <Ionicons name="person" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={styles.gridContainer}>
        {/* Row 1: Sanitation (ID: 1) & Roads & Bridges (ID: 4) */}
        <View style={styles.gridRow}>
          <TouchableOpacity style={styles.gridTile} onPress={() => handleDeptPress(1, 'Sanitation')}>
            <FontAwesome5 name="trash-alt" size={28} color="#4ade80" />
            <Text style={styles.tileLabelText}>Sanitation</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridTile} onPress={() => handleDeptPress(4, 'Roads & Bridges')}>
            <FontAwesome5 name="road" size={26} color="#fbbf24" />
            <Text style={styles.tileLabelText}>Roads & Bridges</Text>
          </TouchableOpacity>
        </View>

        {/* Row 2: Water Supply (ID: 3) & Electricity (ID: 2) */}
        <View style={styles.gridRow}>
          <TouchableOpacity style={styles.gridTile} onPress={() => handleDeptPress(3, 'Water Supply')}>
            <FontAwesome5 name="faucet" size={26} color="#38bdf8" />
            <Text style={styles.tileLabelText}>Water Supply</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridTile} onPress={() => handleDeptPress(2, 'Electricity')}>
            <FontAwesome5 name="lightbulb" size={26} color="#fef08a" />
            <Text style={styles.tileLabelText}>Electricity</Text>
          </TouchableOpacity>
        </View>

        {/* Row 3: Public Health (ID: 5) & Education (ID: 6) */}
        <View style={styles.gridRow}>
          <TouchableOpacity style={styles.gridTile} onPress={() => handleDeptPress(5, 'Public Health')}>
            <FontAwesome5 name="heartbeat" size={26} color="#f43f5e" />
            <Text style={styles.tileLabelText}>Public Health</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridTile} onPress={() => handleDeptPress(6, 'Education')}>
            <FontAwesome5 name="graduation-cap" size={26} color="#cbd5e1" />
            <Text style={styles.tileLabelText}>Education</Text>
          </TouchableOpacity>
        </View>

        {/* Row 4: Transport (ID: 7) & Sewage & Drains (ID: 8) */}
        <View style={styles.gridRow}>
          <TouchableOpacity style={styles.gridTile} onPress={() => handleDeptPress(7, 'Transport')}>
            <FontAwesome5 name="bus" size={26} color="#fb923c" />
            <Text style={styles.tileLabelText}>Transport</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridTile} onPress={() => handleDeptPress(8, 'Sewage & Drains')}>
            <FontAwesome5 name="water" size={26} color="#22d3ee" />
            <Text style={[styles.tileLabelText, { textAlign: 'center' }]}>Sewage & Drains</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}