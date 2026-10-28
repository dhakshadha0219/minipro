import React from 'react';
import { 
  Apple, 
  Layers, 
  SlidersHorizontal, 
  PlayCircle, 
  Activity, 
  CheckCheck, 
  Archive,
  ArrowRight,
  Info,
  Clock,
  Thermometer,
  Droplets,
  Scale
} from 'lucide-react';

export const WorkflowPage: React.FC = () => {
  const steps = [
    {
      step: 1,
      title: 'Prepare the Food',
      icon: Apple,
      color: 'bg-emerald-500',
      description: 'Clean, peel, core, and slice agricultural produce to uniform thickness for optimal heat and mass transfer.',
      parameters: [
        { label: 'Slice Thickness', value: '4 – 6 mm' },
        { label: 'Pretreatment', value: 'Citric Acid Dip (Optional)' },
        { label: 'Quality Check', value: 'Blemish Inspection' }
      ]
    },
    {
      step: 2,
      title: 'Arrange on Trays',
      icon: Layers,
      color: 'bg-blue-500',
      description: 'Single-layer distribution on food-grade stainless mesh trays without overlapping to ensure unimpeded airflow convection.',
      parameters: [
        { label: 'Tray Loading', value: '1.2 – 1.5 kg/m²' },
        { label: 'Spacing', value: '≥ 5 mm clearance' },
        { label: 'Air Passage', value: 'Mesh Open Area > 60%' }
      ]
    },
    {
      step: 3,
      title: 'Set Drying Parameters',
      icon: SlidersHorizontal,
      color: 'bg-indigo-500',
      description: 'Configure target temperature setpoints, relative humidity limits, and desired final moisture percentage in the control system.',
      parameters: [
        { label: 'Temp Setpoint', value: '55.0 – 60.0 °C' },
        { label: 'Target Moisture', value: '15.0 – 20.0 %' },
        { label: 'Airflow Mode', value: 'Automatic Dynamic PID' }
      ]
    },
    {
      step: 4,
      title: 'Start the Dryer',
      icon: PlayCircle,
      color: 'bg-amber-500',
      description: 'Initiate heating cycle and convection blower fan. Verify chamber door interlock and sensor calibration telemetry.',
      parameters: [
        { label: 'Blower Speed', value: '1.2 – 1.6 m/s' },
        { label: 'Heater Output', value: '1.8 kW Continuous' },
        { label: 'Preheat Phase', value: '10 – 15 mins' }
      ]
    },
    {
      step: 5,
      title: 'Monitor the Process',
      icon: Activity,
      color: 'bg-cyan-500',
      description: 'Digital Twin and live telemetry continuously track dehydration curves, moisture loss rate, and trigger threshold alarms if necessary.',
      parameters: [
        { label: 'Telemetry Rate', value: 'Every 5 seconds' },
        { label: 'Warning Limit', value: '> 60.0 °C' },
        { label: 'Moisture Decay', value: 'Fickian Diffusion Curve' }
      ]
    },
    {
      step: 6,
      title: 'Check End Point',
      icon: CheckCheck,
      color: 'bg-purple-500',
      description: 'Automated digital verification when food moisture reaches the target threshold. Moisture content sensor confirms completion.',
      parameters: [
        { label: 'Target End Point', value: '≤ 20.0 % Moisture' },
        { label: 'Water Activity (aw)', value: '< 0.60 (Stable)' },
        { label: 'Verification', value: 'Loss-on-Drying Method' }
      ]
    },
    {
      step: 7,
      title: 'Remove & Store',
      icon: Archive,
      color: 'bg-emerald-600',
      description: 'Cool dehydrated produce to room temperature inside drying chamber, transfer to airtight moisture-barrier containers or vacuum seal.',
      parameters: [
        { label: 'Cool Down Temp', value: '< 30.0 °C' },
        { label: 'Packaging', value: 'Hermetic Mylar / Vacuum' },
        { label: 'Shelf Life', value: '6 – 12 Months' }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
              Bioprocess Engineering Standard
            </span>
            <h2 className="text-2xl font-bold mt-2 text-white">
              Commercial Food Dehydration Process Protocol
            </h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Standard operating procedure (SOP) integrating real-time Digital Twin telemetry to ensure uniform mass transfer, preserve nutrient retention, and prevent microbial degradation.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center border border-white/10">
              <Thermometer className="w-5 h-5 text-amber-400 mx-auto mb-1" />
              <div className="text-xs text-slate-300">Optimal Temp</div>
              <div className="text-sm font-bold text-white">55 – 60 °C</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center border border-white/10">
              <Droplets className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
              <div className="text-xs text-slate-300">Target Moisture</div>
              <div className="text-sm font-bold text-white">18 – 20 %</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center border border-white/10 col-span-2 sm:col-span-1">
              <Clock className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <div className="text-xs text-slate-300">Typical Cycle</div>
              <div className="text-sm font-bold text-white">4 – 8 Hours</div>
            </div>
          </div>
        </div>
      </div>

      {/* Step by Step Flow Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {steps.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div 
              key={item.step}
              className="bg-white rounded-xl border border-slate-200 shadow-card hover:shadow-card-hover transition-all p-5 flex flex-col justify-between relative overflow-hidden"
            >
              {/* Step Number Badge */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl ${item.color} text-white flex items-center justify-center font-bold shadow-md shadow-slate-200`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-blue-600 tracking-wider uppercase">
                      STEP 0{item.step}
                    </span>
                    <h3 className="text-base font-bold text-slate-800 leading-tight">
                      {item.title}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 leading-relaxed my-2">
                {item.description}
              </p>

              {/* Critical Parameters Table */}
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 bg-slate-50/70 p-2.5 rounded-lg text-xs">
                <div className="text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-1">
                  Key Operational Parameters
                </div>
                {item.parameters.map((p, pIdx) => (
                  <div key={pIdx} className="flex items-center justify-between text-slate-700">
                    <span className="text-slate-500 text-[11px]">{p.label}:</span>
                    <span className="font-semibold text-slate-900 text-[11px] font-mono">{p.value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Process Summary Panel */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6">
        <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600" />
          Academic & Biotechnology Process Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="p-3.5 rounded-lg bg-blue-50/60 border border-blue-100">
            <h4 className="font-bold text-blue-900 mb-1 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-blue-700" />
              Mass Transfer Mechanics
            </h4>
            <p className="leading-relaxed text-slate-700 text-[11px]">
              During constant-rate drying, unbound moisture migrates rapidly to the surface via capillary forces. In falling-rate drying, internal moisture diffusion governs dehydration kinetics.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-emerald-50/60 border border-emerald-100">
            <h4 className="font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-emerald-700" />
              Thermal Optimization
            </h4>
            <p className="leading-relaxed text-slate-700 text-[11px]">
              Operating at 55–60 °C prevents enzymatic browning and case-hardening while preserving heat-labile bioactive compounds (e.g. polyphenols, ascorbic acid).
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-purple-50/60 border border-purple-100">
            <h4 className="font-bold text-purple-900 mb-1 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-purple-700" />
              Digital Twin Telemetry
            </h4>
            <p className="leading-relaxed text-slate-700 text-[11px]">
              Continuous feedback loop between chamber sensor telemetry and thermodynamic predictive models ensures automatic threshold enforcement and complete batch traceability.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
