"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, Crown, Sword, Shield, Users, MapPin, AlertTriangle } from "lucide-react"

const loreData = {
  timeline: [
    {
      id: "cold-war-end",
      period: "Konec Studené války",
      icon: <Crown className="h-6 w-6" />,
      title: "Chaos mladé demokracie",
      description: "San Andreas se potýkal s korupcí, sociálními nepokoji a regionálními rozdíly. Tento chaos využil charismatický generál Darius Von Tarr.",
      details: "Mladá demokracie trpěla strukturálními problémy. Korupce pronikla do všech vrstev společnosti, sociální nepokoje narůstaly a regionální rozdíly vytvářely hluboké trhliny ve společnosti."
    },
    {
      id: "military-coup",
      period: "Vojenský převrat",
      icon: <Sword className="h-6 w-6" />,
      title: "Nastolení autoritativního režimu",
      description: "Generál Von Tarr provedl vojenský převrat a následujících 20 let vládl zemi tvrdou rukou, potlačoval opozici a kontroloval média.",
      details: "Autoritativní režim přinesl stabilitu za cenu svobody. Armáda udržovala pořádek, média byla pod kontrolou a opozice systematicky potlačována."
    },
    {
      id: "resistance",
      period: "Formování odporu",
      icon: <Users className="h-6 w-6" />,
      title: "Vznik povstaleckých skupin",
      description: "Proti Von Tarrovi se formovaly různé povstalecké skupiny podporované světovými velmocemi - USA, Ruskem a Čínou.",
      details: "Washington podporoval křesťansko-demokratické rebely, Moskva financovala ultranacionalistické oddíly, Peking nabízel zbraně výměnou za přístup k přístavům."
    },
    {
      id: "foreign-intervention",
      period: "Zahraniční intervence",
      icon: <MapPin className="h-6 w-6" />,
      title: "Proxy válka velmocí",
      description: "Konflikt se změnil v krvavou patovou situaci, kde se linie mezi ideologií a pragmatismem zcela rozmazaly.",
      details: "Každá velmoc měla na ostrově svou klientelu a žádná nebyla ochotna ustoupit. Výsledkem byl dlouholetý konflikt bez jasného vítěze."
    },
    {
      id: "peace-accords",
      period: "Mírové dohody",
      icon: <Shield className="h-6 w-6" />,
      title: "Křehký mír pod dohledem",
      description: "OSN zprostředkovala mírové dohody, které obnovily republiku, ale legalizovaly přítomnost cizích armád 'k udržení míru'.",
      details: "Demokracie existuje, ale v ohavném stavu. Parlament zasedá, ale klíčové otázky bezpečnosti a ekonomiky kontrolují zahraniční velitelství."
    }
  ],
  factions: [
    {
      id: "red-dawn",
      name: "Červený Úsvit",
      type: "Levicový extremismus",
      icon: "🔴",
      description: "Levicoví extremisté nenávidící západní vliv a celý establishment republiky.",
      details: "Organizace čerpá podporu od cizích sponzorů a usiluje o svržení současného systému."
    },
    {
      id: "black-hornet",
      name: "Černý Sršeň",
      type: "Islamistické hnutí",
      icon: "⚫",
      description: "Islamistické hnutí usilující o vyhlášení kalifátu na území San Andreas.",
      details: "Roste na frustraci muslimské menšiny, která se cítí dlouhodobě ignorována etablišmentem."
    },
    {
      id: "shadow-corps",
      name: "Shadow Corps",
      type: "Soukromá vojenská společnost",
      icon: "🛡️",
      description: "Žoldnéřská organizace nevázaná ideologií, sloužící pouze těm, kdo zaplatí.",
      details: "Symbol cynismu - jednou chrání podnikatele, jindy bojují s armádami, když je výhodné, uzavřou dohodu i s teroristy."
    }
  ]
}

export function LoreSection() {
  const [openSections, setOpenSections] = useState<string[]>(['timeline'])

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]
    )
  }

  return (
    <div className="space-y-8">
      {/* Timeline Section */}
      <Card className="bg-card border-border">
        <Collapsible open={openSections.includes('timeline')} onOpenChange={() => toggleSection('timeline')}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">📜</span>
                  <span className="font-serif font-bold text-2xl">Časová osa událostí</span>
                </div>
                {openSections.includes('timeline') ? (
                  <ChevronDown className="h-6 w-6 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-6 w-6 text-muted-foreground" />
                )}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-6">
                {loreData.timeline.map((event, index) => (
                  <div key={event.id} className="relative">
                    <Card className="border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent hover:from-primary/10 transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
                            {event.icon}
                          </div>
                          <div className="flex-grow">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="px-3 py-1 bg-primary/20 text-primary font-medium text-sm rounded-full">
                                {event.period}
                              </span>
                            </div>
                            <h3 className="font-serif font-bold text-xl text-foreground mb-3">{event.title}</h3>
                            <p className="text-muted-foreground leading-relaxed mb-3">{event.description}</p>
                            <div className="text-sm text-muted-foreground/80 bg-muted/30 p-3 rounded-lg border-l-2 border-l-primary/30">
                              {event.details}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Factions Section */}
      <Card className="bg-card border-border">
        <Collapsible open={openSections.includes('factions')} onOpenChange={() => toggleSection('factions')}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">⚔️</span>
                  <span className="font-serif font-bold text-2xl">Současné frakce a organizace</span>
                </div>
                {openSections.includes('factions') ? (
                  <ChevronDown className="h-6 w-6 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-6 w-6 text-muted-foreground" />
                )}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-6">
                {loreData.factions.map((faction) => (
                  <Card key={faction.id} className="bg-gradient-to-br from-muted/50 to-transparent border hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="text-4xl">{faction.icon}</div>
                        <div className="flex-grow">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-serif font-bold text-xl text-foreground">{faction.name}</h3>
                            <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md font-medium">
                              {faction.type}
                            </span>
                          </div>
                          <p className="text-muted-foreground leading-relaxed mb-3">{faction.description}</p>
                          <div className="text-sm text-muted-foreground/90 bg-background/50 p-3 rounded-md border">
                            {faction.details}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Current Situation */}
      <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
        <CardContent className="p-8">
          <div className="flex items-start space-x-4">
            <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-serif font-bold text-2xl text-foreground mb-4">Současná situace</h3>
              <div className="prose prose-lg max-w-none text-muted-foreground leading-relaxed space-y-4">
                <p>
                  <strong className="text-foreground">Paradox svobodné republiky:</strong> San Andreas je formálně svobodná republika, 
                  ale v praxi se jedná o protektorát. Na jeho půdě působí cizí armády, teroristické organizace i soukromé žoldnéřské jednotky.
                </p>
                <p>
                  <strong className="text-foreground">Rukojmí cizí hry:</strong> Obyčejní občané se stali rukojmími mezinárodní politické hry, 
                  ve které mír slouží jen jako zástěrka pro udržování závislosti ostrova na zahraničních mocnostech.
                </p>
                <p>
                  <strong className="text-foreground">Válka jako byznys:</strong> Konflikt se změnil na lukrativní podnikání. 
                  Soukromé vojenské společnosti reprezentují cynismus systému, kde loajalita se prodává nejvyšší nabídce.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}