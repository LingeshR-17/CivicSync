import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/globalStyles';

export default function FeedbackScreen({ onBack, userEmail }) {
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      return Alert.alert("Rating Required", "Please select a star rating level before submitting.");
    }
    if (!comments.trim()) {
      return Alert.alert("Missing Input", "Please write a brief description of your feedback.");
    }

    setSubmitting(true);
    try {
      // 📡 This is ready for your Spring Boot Feedback Controller endpoint later
      const feedbackPayload = {
        email: userEmail || "anonymous@civicsync.com",
        rating: rating,
        comments: comments.trim()
      };
      
      console.log("📤 SUBMITTING APP FEEDBACK:", JSON.stringify(feedbackPayload));
      
      // Simulate endpoint hit
      await new Promise(resolve => setTimeout(resolve, 1000));

      Alert.alert(
        "Thank You!", 
        "Your experience analytics have been sent to the developers.", 
        [{ text: "OK", onPress: onBack }]
      );
    } catch (error) {
      Alert.alert("Submission Failed", "Could not connect to service to save feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.scrollContent, { backgroundColor: '#07161b', padding: 20 }]}>
      {/* Header Back Button */}
      <TouchableOpacity onPress={onBack} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, marginTop: 10 }}>
        <Ionicons name="arrow-back" size={20} color="#a5f3fc" />
        <Text style={{ color: '#a5f3fc', fontSize: 16, marginLeft: 8, fontWeight: '600' }}>Back to Account</Text>
      </TouchableOpacity>

      <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 8 }}>Submit App Feedback</Text>
      <Text style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>Help us improve CivicSync. Rate your system experience below.</Text>

      {/* Interactive Star Rating Selector */}
      <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
        <Text style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12, fontWeight: '600', letterSpacing: 0.5 }}>TAP TO RATE EXPERIENCE</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <Ionicons 
                name={star <= rating ? "star" : "star-outline"} 
                size={32} 
                color={star <= rating ? "#fbbf24" : "#475569"} 
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Comments Form Input */}
      <View style={{ gap: 8, marginBottom: 24 }}>
        <Text style={{ color: '#94a3b8', fontSize: 13 }}>Review Comments</Text>
        <TextInput 
          value={comments} 
          onChangeText={setComments}
          multiline
          numberOfLines={5}
          style={{ 
            backgroundColor: 'rgba(255,255,255,0.05)', 
            color: '#fff', 
            padding: 14, 
            borderRadius: 10, 
            borderWidth: 1, 
            borderColor: 'rgba(255,255,255,0.1)',
            textAlignVertical: 'top',
            minHeight: 120
          }} 
          placeholder="What features can we fix or improve?" 
          placeholderTextColor="#475569" 
        />
      </View>

      {/* Action Submit Button */}
      <TouchableOpacity 
        onPress={handleSubmitFeedback} 
        style={{ backgroundColor: '#0e7490', padding: 16, borderRadius: 10, alignItems: 'center' }} 
        disabled={submitting}
      >
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Submit Review</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}