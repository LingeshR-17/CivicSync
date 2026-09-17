import React, { useState, useEffect } from "react";
import { TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { toggleUpvote } from "../api/api";

/**
 * ❤️ UPVOTE BUTTON — backend-driven, one upvote per citizen (enforced server-side).
 *
 * grievanceItem is expected to carry `upvotes` and `upvotedByMe` as returned by
 * GET /api/grievances?citizenId=... — this is the source of truth, not local storage,
 * so the count is correct across devices and reinstalls, and other users see it update
 * next time their feed refreshes.
 */
export default function UpvoteButton({ grievanceItem, currentCitizenId }) {
  const [upvotes, setUpvotes] = useState(grievanceItem.upvotes || 0);
  const [isUpvoted, setIsUpvoted] = useState(!!grievanceItem.upvotedByMe);
  const [loading, setLoading] = useState(false);

  // Keep in sync whenever the parent refetches the feed (e.g. polling, or another
  // user's upvote changing the true count).
  useEffect(() => {
    setUpvotes(grievanceItem.upvotes || 0);
    setIsUpvoted(!!grievanceItem.upvotedByMe);
  }, [grievanceItem.upvotes, grievanceItem.upvotedByMe]);

  const handlePress = async () => {
    if (loading) return;
    if (!currentCitizenId) {
      Alert.alert("Sign in required", "Please log in to upvote a grievance.");
      return;
    }
    setLoading(true);

    // Snap freeze values for rollback on failure
    const prevIsUpvoted = isUpvoted;
    const prevUpvotes = upvotes;

    // Optimistic UI update
    const nextIsUpvoted = !prevIsUpvoted;
    const nextUpvotes = nextIsUpvoted ? prevUpvotes + 1 : Math.max(0, prevUpvotes - 1);
    setIsUpvoted(nextIsUpvoted);
    setUpvotes(nextUpvotes);

    try {
      // 🎯 Server enforces one-upvote-per-citizen and returns the authoritative count
      const result = await toggleUpvote(grievanceItem.id, currentCitizenId);
      if (result && typeof result.upvotes === "number") {
        setUpvotes(result.upvotes);
        setIsUpvoted(!!result.upvotedByMe);
      }
    } catch (error) {
      console.error("Upvote sync failed:", error);
      // Rollback on failure
      setIsUpvoted(prevIsUpvoted);
      setUpvotes(prevUpvotes);
      Alert.alert("Connection Issue", "Could not synchronize upvote with server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, isUpvoted && styles.containerActive]}
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={loading}
    >
      <Ionicons
        name={isUpvoted ? "heart" : "heart-outline"}
        size={16}
        color={isUpvoted ? "#fff" : "#94a3b8"}
      />
      <Text style={[styles.text, isUpvoted && styles.textActive]}>
        Upvote ({upvotes})
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  containerActive: {
    backgroundColor: "#319795",
    borderColor: "#4fd1c5",
  },
  text: { color: "#94a3b8", fontSize: 13, marginLeft: 6, fontWeight: "600" },
  textActive: { color: "#fff", fontWeight: "700" },
});
