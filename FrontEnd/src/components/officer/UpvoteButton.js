import React, { useState, useEffect } from "react";
import { TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { toggleUpvote } from "../api/api";

export default function UpvoteButton({ grievanceItem, currentCitizenId }) {
    const [upvotes, setUpvotes] = useState(grievanceItem.upvotes || 0);
    const [isUpvoted, setIsUpvoted] = useState(false);
    const [loading, setLoading] = useState(false);

    const storageKey = `@upvote_${grievanceItem.id}_user_${currentCitizenId || 'default'}`;

    // 1. Initial State Sync Loop (Only runs once when the card mounts)
    useEffect(() => {
        const syncComponentState = async () => {
            try {
                const savedStatus = await AsyncStorage.getItem(storageKey);

                if (savedStatus !== null) {
                    const localLiked = JSON.parse(savedStatus);
                    setIsUpvoted(localLiked);

                    // Adjust initial visual count based on cached interaction
                    if (localLiked && grievanceItem.upvotes === 0) {
                        setUpvotes(1);
                        return;
                    }
                }

                // Default to database value
                setUpvotes(grievanceItem.upvotes || 0);
            } catch (err) {
                console.error("Storage lookup failure: ", err);
            }
        };

        syncComponentState();
    }, [grievanceItem.id]);

    // 2. Action Handler (Completely instant, no alternating flip-flops)
    const handlePress = async () => {
        if (loading) return;
        setLoading(false); // Clear lock intentionally to maintain instant tapping UI responses

        // Snap freeze values for safe error rollbacks
        const prevIsUpvoted = isUpvoted;
        const prevUpvotes = upvotes;

        // Calculate next clean step variables
        const nextIsUpvoted = !prevIsUpvoted;
        const nextUpvotes = nextIsUpvoted ? prevUpvotes + 1 : Math.max(0, prevUpvotes - 1);

        // 🏎️ Standard UI Transition: Apply changes right away to prevent lag
        setIsUpvoted(nextIsUpvoted);
        setUpvotes(nextUpvotes);

        try {
            // Lock into hardware right away to survive tab switching
            await AsyncStorage.setItem(storageKey, JSON.stringify(nextIsUpvoted));

            // Quietly process on the network in the background
            await toggleUpvote(grievanceItem.id, currentCitizenId || 1);

            // NOTICE: We do NOT use the server response to change our UI values here.
            // This eliminates the flickering alternating issue completely!
        } catch (error) {
            console.error("Silent network retry fallback activated:", error);

            // Rollback ONLY if the server completely fails
            setIsUpvoted(prevIsUpvoted);
            setUpvotes(prevUpvotes);
            await AsyncStorage.setItem(storageKey, JSON.stringify(prevIsUpvoted));
            Alert.alert("Connection Issue", "Could not synchronize upvote with server.");
        }
    };

    return (
        <TouchableOpacity
            style={[styles.container, isUpvoted && styles.containerActive]}
            onPress={handlePress}
            activeOpacity={0.8}
        >
            <Ionicons
                name={isUpvoted ? "thumbs-up" : "thumbs-up-outline"}
                size={16}
                color={isUpvoted ? "#fff" : "#94a3b8"}
            />
            <Text style={[styles.text, isUpvoted && styles.textActive]}>
                {upvotes} Upvotes
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