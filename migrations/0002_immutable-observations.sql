CREATE FUNCTION reject_inventory_observation_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Source observations are immutable; stage a new observation.'
    USING ERRCODE = '23000';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER inventory_observations_immutable
BEFORE UPDATE OR DELETE ON inventory_observations
FOR EACH ROW EXECUTE FUNCTION reject_inventory_observation_mutation();
