import React from "react";
import { ShieldAlert } from "lucide-react";

const UncertaintyNotice = ({ data }) => (
  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950">
    <div className="mb-2 flex items-center gap-2">
      <ShieldAlert size={18} />
      <h3 className="font-semibold">{data.title}</h3>
    </div>
    <p className="text-sm">{data.answer}</p>
    <div className="mt-4 grid gap-3 md:grid-cols-2">
      <div className="rounded-md bg-white p-3">
        <p className="mb-2 text-sm font-semibold">What I can do</p>
        <ul className="space-y-1 text-sm">{data.canDo?.map((item) => <li key={item}>✓ {item}</li>)}</ul>
      </div>
      <div className="rounded-md bg-white p-3">
        <p className="mb-2 text-sm font-semibold">What I cannot do</p>
        <ul className="space-y-1 text-sm">{data.cannotDo?.map((item) => <li key={item}>× {item}</li>)}</ul>
      </div>
    </div>
    <p className="mt-3 text-sm font-medium">Next step: {data.nextStep}</p>
  </div>
);

export default UncertaintyNotice;
