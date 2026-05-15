"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { PlusIcon, UserPlusIcon } from "lucide-react"
import api from "@/services/api"
import { toast } from "sonner"

export function AddPersonToCaseDialog({ caseId, userRole, onSuccess }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  const isLawyer = userRole === "lawyer"
  const personType = isLawyer ? "client" : "lawyer"

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLawyer) {
        await api.cases.addClient(caseId, email)
        toast.success("Client added successfully!")
      } else {
        await api.cases.addLawyer(caseId, email)
        toast.success("Advocate added successfully!")
      }

      setEmail("")
      setOpen(false)
      
      // Call onSuccess callback to refresh the case data
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error(`Error adding ${personType}:`, error)
      const errorMessage = error.response?.data?.message || `Failed to add ${personType}. Please check the email and try again.`
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlusIcon className="mr-2 h-4 w-4" />
          Add {isLawyer ? "Client" : "Advocate"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add {isLawyer ? "Client" : "Advocate"} to Case</DialogTitle>
            <DialogDescription>
              Enter the email address of the {personType} you want to add to this case.
              They must be registered in the system with the correct role.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="email">{isLawyer ? "Client" : "Advocate"} Email</Label>
              <Input
                id="email"
                type="email"
                placeholder={`${personType}@example.com`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                The {personType} will be able to view and manage this case after being added.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !email}>
              {loading ? "Adding..." : `Add `}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Example usage in a case details page:
/*
import { AddPersonToCaseDialog } from "@/components/add-person-to-case-dialog"

// In your case details component:
<AddPersonToCaseDialog 
  caseId={caseData._id} 
  userRole={user.role} 
  onSuccess={() => {
    // Refresh case data
    fetchCaseData()
  }}
/>
*/