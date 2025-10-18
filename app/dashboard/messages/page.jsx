"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Send, Inbox, User, Clock } from "lucide-react";

export default function MessagesPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600">
            Communicate with clients and team members
          </p>
        </div>

        {/* Coming Soon Message */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-900 mb-2">Messaging Coming Soon!</h2>
              <p className="text-green-700 mb-6">
                We're building a secure messaging system for seamless communication between lawyers, clients, and team members.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-green-600">
                <div className="flex items-center justify-center gap-2">
                  <Send className="h-5 w-5" />
                  <span>Secure Chat</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Inbox className="h-5 w-5" />
                  <span>File Sharing</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <User className="h-5 w-5" />
                  <span>Team Collaboration</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Placeholder Messages */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contacts List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Recent Contacts
              </CardTitle>
              <CardDescription>People you've messaged recently</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">John Client</p>
                    <p className="text-sm text-gray-600">Last message: 2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Sarah Lawyer</p>
                    <p className="text-sm text-gray-600">Last message: 1 day ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-600" />
                Chat Preview
              </CardTitle>
              <CardDescription>Messages will appear here</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-16 text-gray-400">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">Start a Conversation</p>
                <p className="text-sm">Select a contact to begin messaging</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
