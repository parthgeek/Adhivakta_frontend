"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, FileText, Users, Calendar } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">
            Comprehensive insights into your legal practice performance
          </p>
        </div>

        {/* Coming Soon Message */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-blue-900 mb-2">Reports Coming Soon!</h2>
              <p className="text-blue-700 mb-6">
                We're working on powerful analytics and reporting features to help you track your practice performance.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-600">
                <div className="flex items-center justify-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Performance Metrics</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-5 w-5" />
                  <span>Case Analytics</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Users className="h-5 w-5" />
                  <span>Client Insights</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Placeholder Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Case Success Rate
              </CardTitle>
              <CardDescription>Track your case outcomes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-400">
                <p>Chart will be displayed here</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-600" />
                Hearing Schedule
              </CardTitle>
              <CardDescription>Upcoming court dates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-400">
                <p>Timeline will be displayed here</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Client Growth
              </CardTitle>
              <CardDescription>New client acquisition</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-400">
                <p>Growth chart will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
