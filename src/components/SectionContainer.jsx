import React, { forwardRef } from "react";
import { motion } from "framer-motion";

const SectionContainer = forwardRef(function SectionContainer({ title, children, icon: Icon }, ref) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-none rounded-2xl p-6 md:p-8"
    >
      <div ref={ref} className="flex items-center gap-3 pb-2">
        {Icon && <Icon className="w-5 h-5 text-slate-200" />}
        <h2 className="text-xl font-semibold text-slate-200">{title}</h2>
      </div>
      {children}
    </motion.section>
  );
});

export default SectionContainer;
