"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight } from "lucide-react"
import rulesData from "@/data/rules.json"


export function RulesSection() {
  const [openCategories, setOpenCategories] = useState<string[]>(
    rulesData.categories.map(category => category.id)
  )

  const toggleCategory = (categoryId: string) => {
    setOpenCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    )
  }

  return (
    <div className="space-y-6">
      {rulesData.categories.map((category) => (
        <Card key={category.id} className="bg-card border-border">
          <Collapsible open={openCategories.includes(category.id)} onOpenChange={() => toggleCategory(category.id)}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{category.icon}</span>
                    <span className="font-serif font-bold text-xl">{category.title}</span>
                  </div>
                  {openCategories.includes(category.id) ? (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {category.rules.map((rule, index) => (
                    <div
                      key={rule.id}
                      className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-primary font-bold text-lg">{index + 1}.</span>
                          <h3 className="font-serif font-bold text-foreground">{rule.title}</h3>
                        </div>
                      </div>
                      <p className="text-muted-foreground leading-relaxed ml-8">{rule.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}

      <Card className="bg-primary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-serif font-bold text-foreground mb-2">Důležité upozornění</h3>
              <p className="text-muted-foreground leading-relaxed">
                Porušení pravidel může vést k dočasnému nebo trvalému zákazu hry na serveru. V případě nejasností se
                obraťte na administrátory prostřednictvím Discord serveru.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
