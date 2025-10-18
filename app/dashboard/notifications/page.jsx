"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, AlertCircle, CheckCircle, Clock, Info } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">
            Stay updated with important alerts and updates
          </p>
        </div>

        {/* Coming Soon Message */}
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Bell className="h-16 w-16 text-orange-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-orange-900 mb-2">Notifications Coming Soon!</h2>
              <p className="text-orange-700 mb-6">
                We're building a comprehensive notification system to keep you informed about case updates, deadlines, and important events.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-orange-600">
                <div className="flex items-center justify-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  <span>Case Updates</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>Deadline Reminders</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Status Changes</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Placeholder Notifications */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-600" />
                Recent Notifications
              </CardTitle>
              <CardDescription>Your latest updates and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">System Update</p>
                    <p className="text-sm text-blue-700">Notifications feature will be available soon</p>
                    <p className="text-xs text-blue-600 mt-1">2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Clock className="h-5 w-5 text-gray-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Feature Preview</p>
                    <p className="text-sm text-gray-700">Get ready for real-time case notifications</p>
                    <p className="text-xs text-gray-600 mt-1">1 day ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
